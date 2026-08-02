package com.wimmich.app.network

import com.wimmich.app.data.SecureTokenStore
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Server URL is per-user (self-hosted, set at login time), so this builds a
 * fresh Retrofit/OkHttp pair from whatever's currently in SecureTokenStore
 * rather than a single baked-in instance - re-created after login/logout via
 * AppContainer.rebuildApi().
 */
object NetworkModule {

    fun buildOkHttpClient(tokenStore: SecureTokenStore): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(120, TimeUnit.SECONDS) // large photo/video uploads
            .build()
    }

    fun buildApiService(baseUrl: String, client: OkHttpClient): ApiService {
        val normalized = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(normalized)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
