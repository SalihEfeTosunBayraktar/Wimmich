"""Helpers for SQL statements whose bound-parameter count scales with the
size of the user's library rather than being fixed by the query itself."""
from typing import Iterable, Iterator, List, Sequence, TypeVar

T = TypeVar("T")

# SQLite refuses a statement with more bound parameters than
# SQLITE_MAX_VARIABLE_NUMBER, which is 999 on SQLite < 3.32 and 32766 after
# - and which build Python is bundling varies by platform/version, so the
# lower bound is the only safe one to assume. 900 leaves headroom for the
# handful of other parameters a statement carries alongside its IN() list
# (user_id, is_trashed, ...).
#
# Hit for real: the SIMILARITY job's "DELETE FROM similar_assets WHERE
# asset_id IN (?, ?, ...)" over every embedded image in the library failed
# with "sqlite3.OperationalError: too many SQL variables" once the library
# passed ~1000 photos. Any IN() list built from a query result (or from a
# "select all" bulk action) has the same unbounded shape.
MAX_SQL_VARIABLES = 900


def chunked(seq: Sequence[T], size: int = MAX_SQL_VARIABLES) -> Iterator[List[T]]:
    """Yield successive `size`-length chunks of `seq`.

    Callers pass each chunk to its own execute() - for DELETE/UPDATE that's
    simply N statements instead of one, and for SELECT the caller
    concatenates the per-chunk results. Ordering within a chunk is
    preserved, and (since every call site here either has no ORDER BY or
    re-sorts afterwards) so is the caller's own overall ordering.
    """
    items = list(seq)
    for start in range(0, len(items), size):
        yield items[start:start + size]


async def select_in_chunks(db, stmt_builder, values: Iterable, size: int = MAX_SQL_VARIABLES) -> list:
    """Run one SELECT per chunk of `values` and return every scalar row
    across all of them. `stmt_builder` takes one chunk (a list) and returns
    the statement to execute for it."""
    out = []
    for chunk in chunked(list(values), size):
        result = await db.execute(stmt_builder(chunk))
        out.extend(result.scalars().all())
    return out
