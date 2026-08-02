package com.wimmich.app.backup

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.wimmich.app.WimmichApp
import com.wimmich.app.data.local.UploadedAsset
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

/**
 * Scans MediaStore for photos/videos not yet recorded in the local
 * "uploaded_assets" table, uploads them in small batches via the existing
 * POST /api/assets/upload contract (services/asset_mutation_service.py),
 * and calls /api/assets/process-pending once per batch, same as the web
 * upload flow (static/js/upload.js).
 *
 * Real-time "the instant a photo is taken" backup would need a persistent
 * foreground service; this worker is meant to run periodically (~15 min,
 * the WorkManager platform minimum) plus on-demand via a manual trigger -
 * an explicit trade-off documented in the Phase 1 plan.
 */
class BackupWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {

    private val container = (appContext as WimmichApp).container
    private val prefs = appContext.getSharedPreferences("wimmich_backup_prefs", Context.MODE_PRIVATE)

    override suspend fun doWork(): Result {
        val api = container.apiService ?: run {
            BackupStatusRepository.update(BackupStatus.ServerUnreachable)
            return Result.retry()
        }

        val candidates = queryPendingMedia()
        if (candidates.isEmpty()) {
            BackupStatusRepository.update(BackupStatus.Success(System.currentTimeMillis(), 0))
            return Result.success()
        }

        BackupStatusRepository.update(BackupStatus.BackingUp(0, candidates.size))
        val dao = container.backupDb.uploadedAssetDao()
        var uploaded = 0

        try {
            for (batch in candidates.chunked(BATCH_SIZE)) {
                val parts = ArrayList<MultipartBody.Part>()
                val lastModified = ArrayList<String>()
                val checksums = ArrayList<String>()
                val tempFiles = ArrayList<File>()

                for (item in batch) {
                    val tempFile = copyToCache(item.uri) ?: continue
                    tempFiles.add(tempFile)
                    val checksum = ChecksumUtil.sha256(tempFile)
                    val mediaType = (applicationContext.contentResolver.getType(item.uri) ?: "application/octet-stream")
                        .toMediaTypeOrNull()
                    parts.add(
                        MultipartBody.Part.createFormData(
                            "files", item.displayName, tempFile.asRequestBody(mediaType)
                        )
                    )
                    lastModified.add(item.dateAddedMillis.toString())
                    checksums.add(checksum)
                }

                if (parts.isEmpty()) continue

                val response = api.uploadAssets(parts, lastModified, checksums)
                tempFiles.forEach { it.delete() }

                if (!response.isSuccessful) {
                    BackupStatusRepository.update(BackupStatus.Failed("HTTP ${response.code()}"))
                    return Result.retry()
                }

                val body = response.body()
                body?.results?.forEachIndexed { index, result ->
                    val item = batch.getOrNull(index) ?: return@forEachIndexed
                    dao.insert(
                        UploadedAsset(
                            mediaUri = item.uri.toString(),
                            checksum = checksums.getOrElse(index) { "" },
                            remoteAssetId = result.existingId,
                            uploadedAt = System.currentTimeMillis(),
                        )
                    )
                }
                uploaded += (body?.results?.size ?: 0)
                BackupStatusRepository.update(BackupStatus.BackingUp(uploaded, candidates.size))

                api.processPending()
            }
        } catch (e: java.io.IOException) {
            // Network-level failure (host unreachable, timeout, etc.), not a
            // per-file upload error - distinct icon/status from Failed.
            BackupStatusRepository.update(BackupStatus.ServerUnreachable)
            return Result.retry()
        } catch (e: Exception) {
            BackupStatusRepository.update(BackupStatus.Failed(e.message ?: "Unknown error"))
            return Result.retry()
        }

        prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()
        BackupStatusRepository.update(BackupStatus.Success(System.currentTimeMillis(), uploaded))
        return Result.success()
    }

    private data class MediaItem(val uri: Uri, val displayName: String, val dateAddedMillis: Long)

    private suspend fun queryPendingMedia(): List<MediaItem> {
        val dao = container.backupDb.uploadedAssetDao()
        val lastSync = prefs.getLong(KEY_LAST_SYNC, 0L)
        val results = ArrayList<MediaItem>()

        for (collection in listOf(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
        )) {
            val projection = arrayOf(
                MediaStore.MediaColumns._ID,
                MediaStore.MediaColumns.DISPLAY_NAME,
                MediaStore.MediaColumns.DATE_ADDED,
            )
            val selection = "${MediaStore.MediaColumns.DATE_ADDED} > ?"
            val selectionArgs = arrayOf((lastSync / 1000).toString())

            applicationContext.contentResolver.query(
                collection, projection, selection, selectionArgs,
                "${MediaStore.MediaColumns.DATE_ADDED} ASC",
            )?.use { cursor ->
                val idCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
                val nameCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
                val dateCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idCol)
                    val uri = ContentUris.withAppendedId(collection, id)
                    if (dao.findByUri(uri.toString()) != null) continue // already backed up
                    results.add(
                        MediaItem(
                            uri = uri,
                            displayName = cursor.getString(nameCol) ?: "$id",
                            dateAddedMillis = cursor.getLong(dateCol) * 1000,
                        )
                    )
                }
            }
        }
        return results
    }

    private fun copyToCache(uri: Uri): File? {
        val input = applicationContext.contentResolver.openInputStream(uri) ?: return null
        val temp = File.createTempFile("wimmich_upload_", null, applicationContext.cacheDir)
        input.use { inStream ->
            FileOutputStream(temp).use { outStream ->
                inStream.copyTo(outStream)
            }
        }
        return temp
    }

    companion object {
        private const val BATCH_SIZE = 6
        private const val KEY_LAST_SYNC = "last_sync_millis"
    }
}
