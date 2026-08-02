package com.wimmich.app.update

import android.content.Intent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wimmich.app.di.AppContainer
import kotlinx.coroutines.launch

class UpdateViewModel(container: AppContainer) : ViewModel() {
    private val checker = UpdateChecker(container.appContext)
    private val installer = UpdateInstaller(container.appContext)

    var state by mutableStateOf<UpdateState>(UpdateState.Idle)
        private set

    private var pendingInfo: UpdateInfo? = null

    fun checkForUpdate() {
        state = UpdateState.Checking
        viewModelScope.launch {
            try {
                val info = checker.checkForUpdate()
                state = if (info != null) {
                    pendingInfo = info
                    UpdateState.Available(info)
                } else {
                    UpdateState.Idle
                }
            } catch (e: Exception) {
                state = UpdateState.Error(e.message ?: "Could not check for updates")
            }
        }
    }

    /** Returns an Intent to launch (Settings) if permission is needed first, else null. */
    fun requestPermissionIfNeeded(): Intent? =
        if (!installer.canInstallUnknownApps()) installer.requestInstallPermissionIntent() else null

    fun downloadAndPrepareInstall() {
        val info = pendingInfo ?: return
        viewModelScope.launch {
            try {
                state = UpdateState.Downloading(0)
                val file = installer.download(info.downloadUrl) { percent ->
                    state = UpdateState.Downloading(percent)
                }
                checker.markSeen(info.tag)
                state = UpdateState.ReadyToInstall(file)
            } catch (e: Exception) {
                state = UpdateState.Error(e.message ?: "Download failed")
            }
        }
    }

    fun installIntentFor(state: UpdateState.ReadyToInstall): Intent = installer.installIntent(state.apkFile)
}
