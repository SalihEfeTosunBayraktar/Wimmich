"""Background job worker core: polling loop, dispatch, cancellation."""
import asyncio
import threading
import traceback
from datetime import datetime, timezone
from typing import Any, Coroutine
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import config
from database import AsyncSessionLocal
from models import Job
from utils.log import info, success, warn, error

# How often a running job re-checks its own cancelled flag while a single
# long-running unit of work (e.g. one ffmpeg call) is in flight - see
# run_cancellable(). Independent of JOB_POLL_INTERVAL_SECONDS, which is
# about the worker looking for the NEXT job to start, not this.
JOB_CANCEL_POLL_SECONDS = 2


class JobCancelledException(Exception):
    pass


class JobAlreadyExistsException(Exception):
    pass


async def check_job_cancelled(db: AsyncSession, job_id: str):
    """Check if the job has been marked as CANCELLED in the database."""
    stmt = select(Job.status).where(Job.id == job_id)
    res = await db.execute(stmt)
    status = res.scalar_one_or_none()
    if status == "CANCELLED":
        raise JobCancelledException("İşlem kullanıcı tarafından iptal edildi.")


async def run_cancellable(db: AsyncSession, job_id: str, cancel_event: threading.Event, coro: Coroutine) -> Any:
    """Runs `coro` (typically an asyncio.to_thread(...) call wrapping a
    subprocess-based unit of work) while polling the job's cancelled flag
    every JOB_CANCEL_POLL_SECONDS, instead of only checking once before the
    whole thing starts - a plain `await check_job_cancelled(...)` before a
    call that can run for minutes/hours means cancelling mid-call does
    nothing until it finishes on its own. The moment cancellation is seen,
    cancel_event is set so the thread can kill its own subprocess, then
    this waits for that thread to actually finish before re-raising
    JobCancelledException - without that wait, the caller could return
    (and the job get marked CANCELLED) while the underlying process was
    still mid-teardown."""
    task = asyncio.ensure_future(coro)
    while not task.done():
        try:
            await check_job_cancelled(db, job_id)
        except JobCancelledException:
            cancel_event.set()
            await task
            raise
        await asyncio.wait([task], timeout=JOB_CANCEL_POLL_SECONDS)
    return task.result()


class JobWorker:
    """Polls the Job table and dispatches pending jobs to registered handlers."""

    def __init__(self):
        self.running = False
        self._task = None
        self._job_task = None  # the currently executing job's Task, if any
        # "Since this server started" success/failure tallies for the admin
        # panel's job badges - plain instance attributes rather than a DB
        # count so they reset to 0 on every restart instead of accumulating
        # forever, unlike pending/running (which stay live DB counts since
        # PENDING rows genuinely persist across a restart).
        self._session_completed = 0
        self._session_failed = 0
        # Which job _job_task is currently running, and when it was
        # dispatched - needed by the hang watchdog (see _check_hang_watchdog)
        # since job_id/job_type in _worker_loop are loop-local and vanish
        # the moment busy becomes true.
        self._current_job_id = None
        self._current_job_started_at = None
        # Job ids the watchdog has already given up on - checked by
        # _run_job_task so a straggler task that finishes (or fails) late
        # can never overwrite what the watchdog already recorded for it.
        self._watchdog_abandoned_job_ids = set()

    async def start(self):
        """Start the background worker."""
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._worker_loop())
        success("JOB", "Background worker started.")

    async def stop(self):
        """Stop the background worker."""
        self.running = False
        for task in (self._task, self._job_task):
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        info("JOB", "Background worker stopped.")

    async def _recover_orphaned_jobs(self):
        """Reset jobs stuck in RUNNING from a previous crash back to PENDING.

        Handlers skip already-processed assets, so a recovered job resumes
        where it left off instead of redoing everything.
        """
        from sqlalchemy import update
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                update(Job).where(Job.status == "RUNNING").values(status="PENDING")
            )
            await db.commit()
            if result.rowcount:
                warn("JOB", f"Recovered {result.rowcount} orphaned RUNNING job(s) from a previous run.")

    async def _worker_loop(self):
        """Main worker loop - polls for pending jobs.

        Jobs execute as separate Tasks (so this loop and the web server never
        block on them - the handlers push CPU work to threads), but only ONE
        job runs at a time: concurrent jobs meant concurrent SQLite writers
        and double-loaded ML models, which is what crashed the server before.
        """
        from services.job_handlers import handle_cleanup_trash
        from services.job_service import create_job

        await self._recover_orphaned_jobs()

        while self.running:
            job_id = job_type = None
            found_pending = False
            try:
                busy = self._job_task and not self._job_task.done()

                if not busy:
                    async with AsyncSessionLocal() as db:
                        stmt = (
                            select(Job)
                            .where(Job.status == "PENDING")
                            .order_by(Job.created_at)
                            .limit(1)
                        )
                        job = (await db.execute(stmt)).scalar_one_or_none()
                        if job:
                            # Mark RUNNING immediately so it isn't picked up again
                            job.status = "RUNNING"
                            job.started_at = datetime.now(timezone.utc)
                            await db.commit()
                            job_id, job_type = job.id, job.job_type
                            found_pending = True
                            self._current_job_id = job_id
                            self._current_job_started_at = job.started_at
                        else:
                            await handle_cleanup_trash(db)
                            await self._maybe_schedule_backup(db, create_job)
                else:
                    await self._check_hang_watchdog(create_job)

            except Exception as e:
                error("JOB", f"Worker error: {e}")
                await asyncio.sleep(config.JOB_POLL_INTERVAL_SECONDS)
                continue

            if job_id:
                self._job_task = asyncio.create_task(self._run_job_task(job_id, job_type))

            # Bulk imports queue one job per asset - a fixed idle-poll sleep
            # here would throttle the whole batch to one job per interval
            # regardless of how fast each one actually finishes. Only back
            # off to the full interval when there's genuinely nothing to do;
            # otherwise check back quickly so the next PENDING job gets
            # dispatched the moment the current one completes.
            if busy or found_pending:
                await asyncio.sleep(config.JOB_BUSY_CHECK_INTERVAL_SECONDS)
            else:
                await asyncio.sleep(config.JOB_POLL_INTERVAL_SECONDS)

    async def _check_hang_watchdog(self, create_job) -> None:
        """Runs once per loop iteration while busy=True (every
        JOB_BUSY_CHECK_INTERVAL_SECONDS, ~0.2s - cheap, a no-op datetime
        comparison until the threshold is actually exceeded).

        Most handlers have no per-call timeout at all; even the two known
        ML model-download hangs (CLIP/face model first load) are only
        bounded by ML_MODEL_LOAD_TIMEOUT_SECONDS inside clip_service.py/
        face_service.py, not by anything here. This is the general
        backstop: past JOB_HANG_TIMEOUT_MINUTES of wall-clock time since
        dispatch, give up regardless of *why* it's stuck, so one hung job
        can't block the entire queue behind it forever - only one job runs
        at a time by design (see _worker_loop's docstring), so without this
        a single wedged job means nothing else ever runs again.

        Python cannot forcibly kill a thread blocked in a synchronous call
        (asyncio.to_thread) - the old task is abandoned in place, not
        actually terminated. It keeps running/committing in the background
        until it resolves on its own or the process restarts. See
        _run_job_task for how a late straggler is kept from clobbering
        what's written here.
        """
        if not self._current_job_id or not self._current_job_started_at:
            return

        elapsed_min = (datetime.now(timezone.utc) - self._current_job_started_at).total_seconds() / 60
        if elapsed_min < config.JOB_HANG_TIMEOUT_MINUTES:
            return

        job_id = self._current_job_id
        warn("JOB", f"Job {job_id} exceeded the {config.JOB_HANG_TIMEOUT_MINUTES}min hang watchdog - abandoning it.")

        # Recorded synchronously, before any await in this method - by the
        # time any other coroutine (including a resuming straggler) gets
        # scheduled again, this has unconditionally already happened.
        self._watchdog_abandoned_job_ids.add(job_id)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            # Only rewrite if still RUNNING. If it's already CANCELLED, a
            # user hit "Cancel" on this exact job while it was wedged -
            # cancellation is only re-polled between awaits inside a
            # handler, so cancelling a job stuck in one giant blocking call
            # never actually reaches that check, and busy would otherwise
            # stay true forever even though the row already says CANCELLED.
            # Leave their CANCELLED status alone and don't queue a retry
            # (they asked it to stop, not run again), but still free the
            # worker below unconditionally.
            if job and job.status == "RUNNING":
                retries = (job.data or {}).get("_watchdog_retries", 0)
                job.status = "FAILED"
                job.completed_at = datetime.now(timezone.utc)
                self._session_failed += 1

                if retries < config.JOB_HANG_MAX_RETRIES:
                    job.error_message = (
                        f"İşlem {config.JOB_HANG_TIMEOUT_MINUTES} dakikadır yanıt vermediği için "
                        f"zaman aşımına uğradı, yeniden deneniyor ({retries + 1}/{config.JOB_HANG_MAX_RETRIES})."
                    )
                    retry_data = dict(job.data or {})
                    retry_data["_watchdog_retries"] = retries + 1
                    try:
                        new_job = await create_job(db, job.job_type, retry_data)
                        info("JOB", f"Job {job_id} re-queued as {new_job.id} (retry {retries + 1}).")
                    except JobAlreadyExistsException:
                        pass  # an equivalent job is already queued - fine
                else:
                    job.error_message = (
                        f"İşlem {config.JOB_HANG_TIMEOUT_MINUTES} dakikadır yanıt vermediği için "
                        f"zaman aşımına uğradı. {config.JOB_HANG_MAX_RETRIES} deneme sonrası vazgeçildi."
                    )
                    error("JOB", f"Job {job_id} ({job.job_type}) exceeded the retry limit after repeated timeouts - giving up.")
                await db.commit()

        # Stop tracking this task as "busy" so the loop picks up the next
        # PENDING job on its very next iteration.
        self._job_task = None
        self._current_job_id = None
        self._current_job_started_at = None

    async def _maybe_schedule_backup(self, db: AsyncSession, create_job) -> None:
        """Auto-queues a BACKUP job once the configured interval has
        elapsed since the last one - checked on the same idle tick as
        trash cleanup, so it costs nothing extra when there's real work
        pending (create_job's own duplicate check keeps this from ever
        queuing a second BACKUP while one is already PENDING/RUNNING)."""
        from services.backup_service import is_backup_due

        if not is_backup_due():
            return
        try:
            await create_job(db, "BACKUP", None)
        except JobAlreadyExistsException:
            pass

    async def _run_job_task(self, job_id: str, job_type: str):
        """Execute a single job in an isolated DB session (runs as a Task)."""
        from services.job_handlers import JOB_HANDLERS

        info("JOB", f"Processing job {job_id} type={job_type}")
        try:
            async with AsyncSessionLocal() as db:
                # Re-fetch job inside its own session
                result = await db.execute(select(Job).where(Job.id == job_id))
                job = result.scalar_one_or_none()
                if not job:
                    return

                status = error_message = None
                try:
                    handler = JOB_HANDLERS.get(job.job_type)
                    if handler:
                        await handler(db, job)

                    # Check once more in case it was cancelled at the end
                    await check_job_cancelled(db, job.id)
                    status = "COMPLETED"

                except JobCancelledException as e:
                    status, error_message = "CANCELLED", str(e)
                    warn("JOB", f"Job {job_id} cancelled: {e}")
                except Exception as e:
                    status, error_message = "FAILED", str(e)
                    error("JOB", f"Job {job_id} failed: {e}")
                    traceback.print_exc()

                # See _check_hang_watchdog: if it already gave up on this
                # exact job_id (and possibly already queued a retry under a
                # new id), this straggler finishing - however late - must
                # never overwrite what the watchdog already recorded.
                if job_id in self._watchdog_abandoned_job_ids:
                    self._watchdog_abandoned_job_ids.discard(job_id)
                    warn("JOB", f"Job {job_id} finished after the watchdog abandoned it (would have been {status}) - discarded.")
                    return

                job.status = status
                job.completed_at = datetime.now(timezone.utc)
                if status == "COMPLETED":
                    job.progress = 100
                    self._session_completed += 1
                else:
                    job.error_message = error_message
                    if status == "FAILED":
                        self._session_failed += 1

                await db.commit()
        except Exception as e:
            error("JOB", f"Task wrapper error for job {job_id}: {e}")
            traceback.print_exc()

    async def _process_job(self, db: AsyncSession, job: Job):
        """Legacy shim - kept for compatibility, delegates to _run_job_task."""
        await self._run_job_task(job.id, job.job_type)

    def get_session_stats(self) -> dict:
        return {"completed": self._session_completed, "failed": self._session_failed}


# Global worker instance
job_worker = JobWorker()
