package com.wimmich.app.di

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.wimmich.app.ui.backup.BackupStatusViewModel
import com.wimmich.app.ui.gallery.GalleryViewModel
import com.wimmich.app.ui.login.LoginViewModel
import com.wimmich.app.update.UpdateViewModel

/** Manual DI has no Hilt @HiltViewModel wiring, so this is the one place that maps a ViewModel class to its AppContainer-based constructor. */
class ViewModelFactory(private val container: AppContainer) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when (modelClass) {
        LoginViewModel::class.java -> LoginViewModel(container) as T
        BackupStatusViewModel::class.java -> BackupStatusViewModel(container) as T
        GalleryViewModel::class.java -> GalleryViewModel(container) as T
        UpdateViewModel::class.java -> UpdateViewModel(container) as T
        else -> throw IllegalArgumentException("Unknown ViewModel class: $modelClass")
    }
}
