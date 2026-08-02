package com.wimmich.app.backup

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * WiFi-only by default (NetworkType.UNMETERED) since phone photos/videos can
 * be large and this runs unattended in the background - matches how most
 * non-Google backup apps default, distinct from an explicit user choice to
 * allow cellular.
 */
object BackupScheduler {
    private const val PERIODIC_WORK_NAME = "wimmich_periodic_backup"
    private const val MANUAL_WORK_NAME = "wimmich_manual_backup"

    fun schedulePeriodic(context: Context, wifiOnly: Boolean = true, requireCharging: Boolean = false) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
            .setRequiresCharging(requireCharging)
            .build()

        val request = PeriodicWorkRequestBuilder<BackupWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request,
        )
    }

    fun cancelPeriodic(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK_NAME)
    }

    /** "Back up now" button - runs immediately regardless of the WiFi-only constraint. */
    fun runNow(context: Context) {
        val request = OneTimeWorkRequestBuilder<BackupWorker>().build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            MANUAL_WORK_NAME, ExistingWorkPolicy.REPLACE, request,
        )
    }
}
