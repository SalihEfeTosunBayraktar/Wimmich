"""Per-user HTTP request priority (admin-set, 1-5, 5 highest) - see
main.py's priority_gate_middleware for where this is actually invoked.

PriorityGate limits how many requests are handled concurrently; below that
limit every request proceeds immediately in arrival order, identical to no
gate at all. Only once more requests are in flight than the gate allows
does priority matter at all: whichever WAITING request has the highest
priority is admitted next when a slot frees, instead of strict FIFO. On a
small self-hosted server genuine concurrent contention is rare, so most of
the time this changes nothing - it only has a visible effect during a real
burst (e.g. several family members opening the gallery at the same moment).
"""
import asyncio
import heapq
import itertools

import config


class PriorityGate:
    def __init__(self, capacity: int):
        self._capacity = capacity
        self._active = 0
        self._waiters = []  # heap of (-priority, seq, event) - seq breaks ties FIFO
        self._counter = itertools.count()
        self._lock = asyncio.Lock()

    async def acquire(self, priority: int) -> None:
        async with self._lock:
            if self._active < self._capacity:
                self._active += 1
                return
            event = asyncio.Event()
            heapq.heappush(self._waiters, (-priority, next(self._counter), event))
        await event.wait()
        # Woken by release() below, which already accounted for this waiter
        # taking over the freed slot - nothing left to update here.

    async def release(self) -> None:
        async with self._lock:
            if self._waiters:
                _, _, event = heapq.heappop(self._waiters)
                event.set()  # hands the same slot straight to the highest-priority waiter
            else:
                self._active -= 1


# One process-wide gate - request handling itself is the resource being
# scheduled, not any single endpoint's internals.
request_gate = PriorityGate(capacity=config.REQUEST_PRIORITY_GATE_CAPACITY)
