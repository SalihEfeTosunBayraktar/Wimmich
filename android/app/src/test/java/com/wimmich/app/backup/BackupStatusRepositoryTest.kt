package com.wimmich.app.backup

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BackupStatusRepositoryTest {

    @Test
    fun `updates are reflected immediately in the shared status flow`() {
        BackupStatusRepository.update(BackupStatus.Idle)
        assertTrue(BackupStatusRepository.status.value is BackupStatus.Idle)

        BackupStatusRepository.update(BackupStatus.BackingUp(uploaded = 2, total = 5))
        val backingUp = BackupStatusRepository.status.value as BackupStatus.BackingUp
        assertEquals(2, backingUp.uploaded)
        assertEquals(5, backingUp.total)

        BackupStatusRepository.update(BackupStatus.ServerUnreachable)
        assertTrue(BackupStatusRepository.status.value is BackupStatus.ServerUnreachable)

        BackupStatusRepository.update(BackupStatus.Failed("boom"))
        assertEquals("boom", (BackupStatusRepository.status.value as BackupStatus.Failed).message)
    }
}
