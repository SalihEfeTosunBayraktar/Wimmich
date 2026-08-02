package com.wimmich.app

import android.app.Application
import com.wimmich.app.backup.BackupScheduler
import com.wimmich.app.di.AppContainer

class WimmichApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        if (container.tokenStore.isLoggedIn) {
            BackupScheduler.schedulePeriodic(this)
        }
    }
}
