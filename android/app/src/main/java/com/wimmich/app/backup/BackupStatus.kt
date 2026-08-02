package com.wimmich.app.backup

/**
 * Drives both the in-app status screen and the notification icon (see
 * res/drawable/ic_cloud_*.xml and ic_server_*.xml). ServerUnreachable is kept
 * distinct from Failed so it can render with the server-offline icon instead
 * of the generic backup-error one - a dead/unreachable server reads very
 * differently to a user than "some files failed to upload".
 */
sealed class BackupStatus {
    data object Idle : BackupStatus()
    data class BackingUp(val uploaded: Int, val total: Int) : BackupStatus()
    data class Success(val uploadedAt: Long, val count: Int) : BackupStatus()
    data class Failed(val message: String) : BackupStatus()
    data object ServerUnreachable : BackupStatus()
}
