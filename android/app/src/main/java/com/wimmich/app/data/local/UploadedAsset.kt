package com.wimmich.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * One row per local media file already backed up - keyed by the MediaStore
 * content URI string, so a re-scan skips it even before the "date_added
 * after last sync point" query filter would (e.g. the filter's timestamp
 * bookkeeping getting reset, or a file's date_added not being monotonic).
 */
@Entity(tableName = "uploaded_assets")
data class UploadedAsset(
    @PrimaryKey val mediaUri: String,
    val checksum: String,
    val remoteAssetId: String?,
    val uploadedAt: Long,
)
