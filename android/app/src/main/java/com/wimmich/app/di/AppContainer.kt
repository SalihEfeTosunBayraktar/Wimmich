package com.wimmich.app.di

import android.content.Context
import coil.ImageLoader
import com.wimmich.app.data.SecureTokenStore
import com.wimmich.app.data.local.BackupDb
import com.wimmich.app.network.ApiService
import com.wimmich.app.network.NetworkModule

/**
 * Lightweight manual DI root (no Hilt for this first pass - kept simple
 * since the dependency graph is small). Held by WimmichApp; BackupWorker
 * reaches it via (applicationContext as WimmichApp).container since
 * WorkManager instantiates workers by reflection without DI support unless
 * a custom WorkerFactory is registered.
 */
class AppContainer(val appContext: Context) {
    val tokenStore = SecureTokenStore(appContext)
    val backupDb = BackupDb.get(appContext)

    /** Null until logged in (no server URL/API key yet). */
    var apiService: ApiService? = null
        private set

    /** Same authenticated OkHttpClient as apiService, so Coil can load thumbnails/full images
     * that require the same Authorization header the REST API needs. */
    var imageLoader: ImageLoader? = null
        private set

    init {
        rebuildApi()
    }

    /** Call after login succeeds or on logout, since the server URL/API key just changed. */
    fun rebuildApi() {
        val url = tokenStore.serverUrl
        if (url.isNullOrBlank()) {
            apiService = null
            imageLoader = null
        } else {
            val client = NetworkModule.buildOkHttpClient(tokenStore)
            apiService = NetworkModule.buildApiService(url, client)
            imageLoader = ImageLoader.Builder(appContext)
                .okHttpClient(client)
                .build()
        }
    }
}
