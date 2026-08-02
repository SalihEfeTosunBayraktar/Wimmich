package com.wimmich.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface UploadedAssetDao {
    @Query("SELECT mediaUri FROM uploaded_assets WHERE mediaUri = :mediaUri LIMIT 1")
    suspend fun findByUri(mediaUri: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(asset: UploadedAsset)

    @Query("SELECT COUNT(*) FROM uploaded_assets")
    suspend fun count(): Int
}
