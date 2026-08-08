"""The server-side ceiling on the storage limit.

A limit larger than the drive can hold is not a limit - the disk fills up
first and the warning badges it exists to trigger never fire. The admin
panel checks this too, but that check is a courtesy: anything talking to
the API directly bypasses it, so the rule has to live here.
"""
import shutil

import pytest
from conftest import auth

import config


def _current_config(client, token):
    return client.get("/api/admin/config", headers=auth(token))


async def test_zero_means_unlimited_and_is_always_accepted(client, admin):
    """0 is "no limit", so there is nothing to compare it against - it must
    never be rejected for being larger than the disk."""
    current = (await _current_config(client, admin["token"])).json()
    resp = await client.post(
        "/api/admin/config",
        json={"data_dir": current["data_dir"], "total_storage_limit_mb": 0},
        headers=auth(admin["token"]),
    )
    assert resp.status_code == 200, resp.text


async def test_a_limit_bigger_than_the_drive_is_refused(client, admin):
    current = (await _current_config(client, admin["token"])).json()
    absurd = 1024 * 1024 * 1024  # 1 PB in MB - larger than any test machine

    resp = await client.post(
        "/api/admin/config",
        json={"data_dir": current["data_dir"], "total_storage_limit_mb": absurd},
        headers=auth(admin["token"]),
    )
    assert resp.status_code == 400, resp.text
    assert "en çok" in resp.json()["detail"], resp.json()

    # and it really wasn't applied
    after = (await _current_config(client, admin["token"])).json()
    assert after["total_storage_limit_mb"] != absurd


async def test_a_limit_that_fits_is_accepted(client, admin):
    """The complement of the test above - the check must not be a blanket
    refusal of every non-zero value."""
    current = (await _current_config(client, admin["token"])).json()
    free_mb = shutil.disk_usage(config.DATA_DIR).free // (1024 * 1024)
    modest = max(1, free_mb // 4)

    resp = await client.post(
        "/api/admin/config",
        json={"data_dir": current["data_dir"], "total_storage_limit_mb": modest},
        headers=auth(admin["token"]),
    )
    assert resp.status_code == 200, resp.text

    after = (await _current_config(client, admin["token"])).json()
    assert after["total_storage_limit_mb"] == modest

    # put it back so later tests and the shared fixture DB aren't left capped
    await client.post(
        "/api/admin/config",
        json={"data_dir": current["data_dir"],
              "total_storage_limit_mb": current["total_storage_limit_mb"]},
        headers=auth(admin["token"]),
    )


async def test_a_normal_user_cannot_change_the_limit(client, member):
    resp = await client.post(
        "/api/admin/config",
        json={"data_dir": str(config.DATA_DIR), "total_storage_limit_mb": 1},
        headers=auth(member["token"]),
    )
    assert resp.status_code == 403


@pytest.mark.parametrize("mb, expected", [
    (1024 * 1024, "1 TB"),
    (2 * 1024 * 1024, "2 TB"),
    (1024, "1 GB"),
    (500, "500 MB"),
    (1000024, "1000024 MB"),   # not a round anything - must stay in MB
    (0, "0 MB"),
])
def test_a_stored_value_renders_in_its_largest_exact_unit(mb, expected):
    """Matches how the panel renders the same number. Showing 1000024 MB as
    "976.59 GB" anywhere would invite writing back a different value than
    the one that is actually stored."""
    from routers.admin_config_router import _format_mb

    assert _format_mb(mb) == expected


@pytest.mark.parametrize("mb, expected", [
    (277401, "270.9 GB"),        # a real drive's spare room: never round
    (1024 * 1024, "1 TB"),
    (1536 * 1024, "1.5 TB"),
    (1024, "1 GB"),
    (500, "500 MB"),
])
def test_a_ceiling_renders_in_the_largest_unit_not_the_exact_one(mb, expected):
    """The exact-multiple rule is wrong for a maximum - free disk space is
    never a round number, so it would always print as a seven-digit MB
    count. This mirrors _formatStorageCap in admin-render.js so the API
    error and the hint under the field spell the same ceiling the same way."""
    from routers.admin_config_router import _format_cap_mb

    assert _format_cap_mb(mb) == expected
