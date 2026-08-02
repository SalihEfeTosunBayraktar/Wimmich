package com.wimmich.app.backup

import java.io.File
import java.security.MessageDigest

/** Pulled out of BackupWorker so it's testable without an Android Context/CoroutineWorker instance. */
object ChecksumUtil {
    fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { stream ->
            val buffer = ByteArray(8192)
            var read: Int
            while (stream.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
}
