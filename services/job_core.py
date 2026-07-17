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

    async def start(self):
        """Start the background worker."""
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._worker_loop())
        print("[JOB] Background worker started.")

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
        print("[JOB] Background worker stopped.")

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
                print(f"[JOB] Recovered {result.rowcount} orphaned RUNNING job(s) from a previous run.")

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
                        else:
                            await handle_cleanup_trash(db)
                            await self._maybe_schedule_backup(db, create_job)

            except Exception as e:
                print(f"[JOB] Worker error: {e}")
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

        print(f"[JOB] Processing job {job_id} type={job_type}")
        try:
            async with AsyncSessionLocal() as db:
                # Re-fetch job inside its own session
                result = await db.execute(select(Job).where(Job.id == job_id))
                job = result.scalar_one_or_none()
                if not job:
                    return

                try:
                    handler = JOB_HANDLERS.get(job.job_type)
                    if handler:
                        await handler(db, job)

                    # Check once more in case it was cancelled at the end
                    await check_job_cancelled(db, job.id)

                    job.status = "COMPLETED"
                    job.progress = 100
                    job.completed_at = datetime.now(timezone.utc)

                except JobCancelledException as e:
                    job.status = "CANCELLED"
                    job.error_message = str(e)
                    job.completed_at = datetime.now(timezone.utc)
                    print(f"[JOB] Job {job_id} cancelled: {e}")
                except Exception as e:
                    job.status = "FAILED"
                    job.error_message = str(e)
                    job.completed_at = datetime.now(timezone.utc)
                    print(f"[JOB] Job {job_id} failed: {e}")
                    traceback.print_exc()

                await db.commit()
        except Exception as e:
            print(f"[JOB] Task wrapper error for job {job_id}: {e}")
            traceback.print_exc()

    async def _process_job(self, db: AsyncSession, job: Job):
        """Legacy shim - kept for compatibility, delegates to _run_job_task."""
        await self._run_job_task(job.id, job.job_type)


# Global worker instance
job_worker = JobWorker()
