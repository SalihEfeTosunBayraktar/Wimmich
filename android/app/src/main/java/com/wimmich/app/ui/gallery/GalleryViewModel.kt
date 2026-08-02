package com.wimmich.app.ui.gallery

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wimmich.app.di.AppContainer
import com.wimmich.app.network.Asset
import kotlinx.coroutines.launch

class GalleryViewModel(private val container: AppContainer) : ViewModel() {
    var assets by mutableStateOf<List<Asset>>(emptyList())
        private set
    var isLoading by mutableStateOf(false)
        private set
    var error by mutableStateOf<String?>(null)
        private set

    private var page = 1
    private var totalPages = 1

    val serverUrl: String? get() = container.tokenStore.serverUrl
    fun imageLoader() = container.imageLoader

    fun loadFirstPage() {
        page = 1
        assets = emptyList()
        loadNextPage()
    }

    fun loadNextPage() {
        val api = container.apiService ?: run { error = "Not logged in"; return }
        if (isLoading || page > totalPages) return

        isLoading = true
        viewModelScope.launch {
            try {
                val response = api.getGallery(page = page)
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    assets = assets + body.groups.flatMap { it.assets }
                    totalPages = body.totalPages
                    page += 1
                } else {
                    error = "Failed to load gallery (HTTP ${response.code()})"
                }
            } catch (e: Exception) {
                error = e.message ?: "Could not reach the server"
            } finally {
                isLoading = false
            }
        }
    }
}
