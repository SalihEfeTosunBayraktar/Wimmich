package com.wimmich.app.backup

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Process-wide holder for the current backup state, since BackupWorker (runs
 * on a WorkManager thread, possibly with the app in the background) and the
 * UI (BackupStatusScreen) both need to observe the same value. A singleton
 * StateFlow is enough for Phase 1 - no need for cross-process IPC since
 * WorkManager runs in-process on Android.
 */
object BackupStatusRepository {
    private val _status = MutableStateFlow<BackupStatus>(BackupStatus.Idle)
    val status: StateFlow<BackupStatus> = _status.asStateFlow()

    fun update(newStatus: BackupStatus) {
        _status.value = newStatus
    }
}
