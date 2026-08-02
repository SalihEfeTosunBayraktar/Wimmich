package com.wimmich.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.wimmich.app.backup.BackupScheduler
import com.wimmich.app.di.ViewModelFactory
import com.wimmich.app.ui.backup.BackupStatusScreen
import com.wimmich.app.ui.gallery.GalleryScreen
import com.wimmich.app.ui.login.LoginScreen
import com.wimmich.app.ui.theme.WimmichTheme

class MainActivity : ComponentActivity() {

    private val requestMediaPermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* Backup simply won't find anything to upload until granted - no extra handling needed here. */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val container = (application as WimmichApp).container
        val viewModelFactory = ViewModelFactory(container)

        requestMediaPermissions.launch(requiredMediaPermissions())

        setContent {
            WimmichTheme {
                var loggedIn by remember { mutableIntStateOf(if (container.tokenStore.isLoggedIn) 1 else 0) }
                var selectedTab by remember { mutableIntStateOf(0) }

                if (loggedIn == 0) {
                    LoginScreen(viewModelFactory) {
                        BackupScheduler.schedulePeriodic(this)
                        loggedIn = 1
                    }
                } else {
                    Scaffold(
                        bottomBar = {
                            NavigationBar {
                                NavigationBarItem(
                                    selected = selectedTab == 0,
                                    onClick = { selectedTab = 0 },
                                    icon = { Icon(Icons.Filled.CloudUpload, contentDescription = "Backup") },
                                    label = { Text("Backup") },
                                )
                                NavigationBarItem(
                                    selected = selectedTab == 1,
                                    onClick = { selectedTab = 1 },
                                    icon = { Icon(Icons.Filled.Photo, contentDescription = "Gallery") },
                                    label = { Text("Gallery") },
                                )
                            }
                        },
                    ) { padding ->
                        androidx.compose.foundation.layout.Box(modifier = androidx.compose.ui.Modifier.padding(padding)) {
                            if (selectedTab == 0) {
                                BackupStatusScreen(viewModelFactory)
                            } else {
                                GalleryScreen(viewModelFactory)
                            }
                        }
                    }
                }
            }
        }
    }

    private fun requiredMediaPermissions(): Array<String> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.POST_NOTIFICATIONS)
    } else {
        arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    }
}
