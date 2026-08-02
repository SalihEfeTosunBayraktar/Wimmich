package com.wimmich.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [UploadedAsset::class], version = 1, exportSchema = false)
abstract class BackupDb : RoomDatabase() {
    abstract fun uploadedAssetDao(): UploadedAssetDao

    companion object {
        @Volatile private var instance: BackupDb? = null

        fun get(context: Context): BackupDb =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    BackupDb::class.java,
                    "wimmich_backup.db",
                ).build().also { instance = it }
            }
    }
}
