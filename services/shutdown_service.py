"""Shared graceful-cleanup + process-exit logic for the admin panel's
Shutdown and Update-and-restart actions - the only difference between
"stop for good" and "stop so start.bat relaunches me" is the exit code.
"""
import asyncio
import gc
import os

# start.bat treats this specific exit code as "relaunch me" (see its
# restart loop) - any other exit code (0 for a clean shutdown, anything
# else for a crash) falls through to the normal end-of-script pause.
RESTART_EXIT_CODE = 42


async def graceful_cleanup() -> None:
    """Stop background work and release GPU/CPU memory before the process
    exits - the safe alternative to a hard window close, which kills
    everything (the Cloudflare Tunnel child process included) with none of
    this, and can visibly stall the machine while Windows reclaims several
    GB of abruptly-orphaned CUDA memory in one go instead of it being
    released in an orderly way first."""
    from services.job_service import job_worker
    from services.tunnel_service import stop_tunnel

    await job_worker.stop()
    await stop_tunnel()

    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass
    gc.collect()


def schedule_exit(code: int, delay: float = 0.5) -> None:
    """Exits the process shortly after this is called, instead of
    immediately - gives the HTTP response time to actually reach the
    browser before the process disappears out from under the connection."""
    async def _exit_after_response():
        await asyncio.sleep(delay)
        os._exit(code)

    asyncio.create_task(_exit_after_response())
