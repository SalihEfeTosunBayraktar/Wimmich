package com.wimmich.app.ui.backup

import androidx.lifecycle.ViewModel
import com.wimmich.app.backup.BackupStatus
import com.wimmich.app.backup.BackupStatusRepository
import com.wimmich.app.di.AppContainer
import kotlinx.coroutines.flow.StateFlow

class BackupStatusViewModel(private val container: AppContainer) : ViewModel() {
    val status: StateFlow<BackupStatus> = BackupStatusRepository.status
}
