package com.wimmich.app.ui.backup

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.wimmich.app.R
import com.wimmich.app.backup.BackupScheduler
import com.wimmich.app.backup.BackupStatus
import com.wimmich.app.di.ViewModelFactory
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.draw.rotate
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import com.wimmich.app.update.UpdateState
import com.wimmich.app.update.UpdateViewModel

@Composable
fun BackupStatusScreen(viewModelFactory: ViewModelFactory) {
    val viewModel: BackupStatusViewModel = viewModel(factory = viewModelFactory)
    val status by viewModel.status.collectAsState()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        BackupStatusIcon(status)

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 16.dp))
        Text(statusLabel(status), style = MaterialTheme.typography.titleMedium)

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ServerStatusIndicator(status)
        }

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 24.dp))
        Button(onClick = { BackupScheduler.runNow(context) }, modifier = Modifier.fillMaxWidth()) {
            Text("Back up now")
        }

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 24.dp))
        AppUpdateSection(viewModelFactory)
    }
}

/** Checks GitHub Releases (see update/UpdateChecker.kt) once when this screen
 * appears, and shows an "Update available" / download / install flow if a
 * newer android-vX release with the expected APK asset is found. */
@Composable
private fun AppUpdateSection(viewModelFactory: ViewModelFactory) {
    val updateViewModel: UpdateViewModel = viewModel(factory = viewModelFactory)
    val state = updateViewModel.state
    val context = LocalContext.current

    LaunchedEffect(Unit) { updateViewModel.checkForUpdate() }

    when (state) {
        is UpdateState.Available -> {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Update available: ${state.info.tag}", style = MaterialTheme.typography.bodyMedium)
                OutlinedButton(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    onClick = {
                        val permissionIntent = updateViewModel.requestPermissionIfNeeded()
                        if (permissionIntent != null) {
                            context.startActivity(permissionIntent)
                        } else {
                            updateViewModel.downloadAndPrepareInstall()
                        }
                    },
                ) {
                    Text("Download update")
                }
            }
        }
        is UpdateState.Downloading -> {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Downloading update... ${state.progressPercent}%", style = MaterialTheme.typography.bodySmall)
                LinearProgressIndicator(
                    progress = { state.progressPercent / 100f },
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                )
            }
        }
        is UpdateState.ReadyToInstall -> {
            Button(
                modifier = Modifier.fillMaxWidth(),
                onClick = { context.startActivity(updateViewModel.installIntentFor(state)) },
            ) {
                Text("Install update")
            }
        }
        is UpdateState.Error -> {
            Text("Update check failed: ${state.message}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }
        else -> {}
    }
}

@Composable
private fun BackupStatusIcon(status: BackupStatus) {
    val resId = when (status) {
        is BackupStatus.Idle -> R.drawable.ic_cloud_idle
        is BackupStatus.BackingUp -> R.drawable.ic_cloud_sync
        is BackupStatus.Success -> R.drawable.ic_cloud_done
        is BackupStatus.Failed -> R.drawable.ic_cloud_error
        is BackupStatus.ServerUnreachable -> R.drawable.ic_cloud_error
    }
    val painter = painterResource(id = resId)

    if (status is BackupStatus.BackingUp) {
        val transition = rememberInfiniteTransition(label = "backup-sync-rotation")
        val angle by transition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing), RepeatMode.Restart),
            label = "angle",
        )
        Image(
            painter = painter,
            contentDescription = "Backing up",
            modifier = Modifier.size(72.dp).rotate(angle),
        )
    } else {
        Image(painter = painter, contentDescription = "Backup status", modifier = Modifier.size(72.dp))
    }
}

@Composable
private fun ServerStatusIndicator(status: BackupStatus) {
    val resId = if (status is BackupStatus.ServerUnreachable) {
        R.drawable.ic_server_offline
    } else {
        R.drawable.ic_server_online
    }
    val label = if (status is BackupStatus.ServerUnreachable) "Server unreachable" else "Server reachable"
    Image(
        painter = painterResource(id = resId),
        contentDescription = label,
        modifier = Modifier.size(24.dp),
    )
    Text(label, style = MaterialTheme.typography.bodySmall)
}

private fun statusLabel(status: BackupStatus): String = when (status) {
    is BackupStatus.Idle -> "Up to date"
    is BackupStatus.BackingUp -> "Backing up ${status.uploaded}/${status.total}..."
    is BackupStatus.Success -> if (status.count > 0) "Backed up ${status.count} item(s)" else "Up to date"
    is BackupStatus.Failed -> "Backup failed: ${status.message}"
    is BackupStatus.ServerUnreachable -> "Server unreachable - will retry automatically"
}
