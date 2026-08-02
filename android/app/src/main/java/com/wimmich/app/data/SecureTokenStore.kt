package com.wimmich.app.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Holds the two things needed to talk to a self-hosted Wimmich server: the
 * server's own base URL (there's no fixed SaaS endpoint - self-hosted, so the
 * user types in their own LAN address or tunnel/Tailscale domain) and a
 * long-lived API key minted once at login time (routers/api_keys_router.py's
 * "future mobile app" design - avoids the 7-day JWT expiring silently under a
 * background worker).
 */
class SecureTokenStore(context: Context) {
    private val prefs: SharedPreferences

    init {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            "wimmich_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    var serverUrl: String?
        get() = prefs.getString(KEY_SERVER_URL, null)
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()

    var apiKey: String?
        get() = prefs.getString(KEY_API_KEY, null)
        set(value) = prefs.edit().putString(KEY_API_KEY, value).apply()

    val isLoggedIn: Boolean
        get() = !serverUrl.isNullOrBlank() && !apiKey.isNullOrBlank()

    fun clear() {
        prefs.edit().remove(KEY_SERVER_URL).remove(KEY_API_KEY).apply()
    }

    companion object {
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_API_KEY = "api_key"
    }
}
