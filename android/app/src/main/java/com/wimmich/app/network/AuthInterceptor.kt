package com.wimmich.app.network

import com.wimmich.app.data.SecureTokenStore
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Attaches `Authorization: Bearer <api key>` to every request - the same
 * header shape auth.py's get_current_user accepts for either a JWT or an API
 * key (it tells them apart by the "wmk_" prefix), so this works unmodified
 * against the existing backend.
 */
class AuthInterceptor(private val tokenStore: SecureTokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val apiKey = tokenStore.apiKey
        val authed = if (apiKey != null) {
            request.newBuilder()
                .addHeader("Authorization", "Bearer $apiKey")
                .build()
        } else {
            request
        }
        return chain.proceed(authed)
    }
}
