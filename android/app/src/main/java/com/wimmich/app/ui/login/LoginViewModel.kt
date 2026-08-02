package com.wimmich.app.ui.login

import android.os.Build
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wimmich.app.di.AppContainer
import com.wimmich.app.network.CreateApiKeyRequest
import com.wimmich.app.network.LoginRequest
import com.wimmich.app.network.NetworkModule
import kotlinx.coroutines.launch

sealed class LoginState {
    data object Idle : LoginState()
    data object LoggingIn : LoginState()
    data object Success : LoginState()
    data class Error(val message: String) : LoginState()
}

class LoginViewModel(private val container: AppContainer) : ViewModel() {
    var serverUrl by mutableStateOf("")
    var email by mutableStateOf("")
    var password by mutableStateOf("")
    var state by mutableStateOf<LoginState>(LoginState.Idle)
        private set

    fun login() {
        val url = serverUrl.trim()
        if (url.isBlank() || email.isBlank() || password.isBlank()) {
            state = LoginState.Error("Server URL, email, and password are all required")
            return
        }

        state = LoginState.LoggingIn
        viewModelScope.launch {
            try {
                // Not yet persisted (login hasn't succeeded), so build a
                // one-off client for this attempt instead of going through
                // container.apiService (still null pre-login).
                val client = NetworkModule.buildOkHttpClient(container.tokenStore)
                val api = NetworkModule.buildApiService(url, client)

                val loginResponse = api.login(LoginRequest(email, password))
                if (!loginResponse.isSuccessful || loginResponse.body()?.token == null) {
                    state = LoginState.Error(loginResponse.body()?.message ?: "Login failed")
                    return@launch
                }

                // Mint a dedicated, non-expiring API key for this device -
                // routers/api_keys_router.py's explicit "future mobile app"
                // path, avoids the 7-day JWT expiring under a background
                // worker (config.py JWT_EXPIRE_HOURS).
                container.tokenStore.serverUrl = url
                container.tokenStore.apiKey = loginResponse.body()!!.token // temporary, replaced below
                container.rebuildApi()

                val keyResponse = container.apiService!!.createApiKey(
                    CreateApiKeyRequest(name = "Android - ${Build.MODEL}", expiresInDays = null)
                )
                if (!keyResponse.isSuccessful || keyResponse.body() == null) {
                    state = LoginState.Error("Logged in, but could not create a device API key")
                    return@launch
                }

                container.tokenStore.apiKey = keyResponse.body()!!.key
                container.rebuildApi()
                state = LoginState.Success
            } catch (e: Exception) {
                state = LoginState.Error(e.message ?: "Could not reach the server")
            }
        }
    }
}
