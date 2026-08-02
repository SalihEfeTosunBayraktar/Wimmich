package com.wimmich.app.ui.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.Coil
import coil.compose.AsyncImage
import com.wimmich.app.di.ViewModelFactory
import com.wimmich.app.network.Asset

/**
 * Basic paginated grid over GET /api/assets/gallery (services/gallery_service.py),
 * same endpoint and thumbnail contract the web app's gallery.js uses. Video
 * playback and a richer full-screen viewer are Phase 2 - tapping a thumbnail
 * here is out of scope for this pass.
 */
@Composable
fun GalleryScreen(viewModelFactory: ViewModelFactory) {
    val viewModel: GalleryViewModel = viewModel(factory = viewModelFactory)

    LaunchedEffect(Unit) { viewModel.loadFirstPage() }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyVerticalGrid(columns = GridCells.Fixed(3)) {
            items(viewModel.assets, key = { it.id }) { asset ->
                GalleryThumbnail(asset, viewModel)
            }
        }

        if (viewModel.isLoading && viewModel.assets.isEmpty()) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        }
        viewModel.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
        }
    }
}

@Composable
private fun GalleryThumbnail(asset: Asset, viewModel: GalleryViewModel) {
    val thumbPath = asset.thumbSmall ?: asset.thumbMedium
    val fullUrl = if (thumbPath != null) "${viewModel.serverUrl?.trimEnd('/')}$thumbPath" else null
    val context = LocalContext.current
    val imageLoader = viewModel.imageLoader() ?: Coil.imageLoader(context)

    AsyncImage(
        model = fullUrl,
        imageLoader = imageLoader,
        contentDescription = asset.fileName,
        modifier = Modifier
            .aspectRatio(1f)
            .background(MaterialTheme.colorScheme.surfaceVariant),
    )
}
