package com.wimmich.app.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

/**
 * Downloads the release APK (a plain public GitHub URL - no auth headers,
 * so this uses its own bare OkHttpClient rather than the authenticated one
 * from NetworkModule) and hands it to the system package installer via
 * FileProvider. Android will not silently install a sideloaded update - the
 * user must tap through the system installer's confirmation, and (on API 26+)
 * grant this app "install unknown apps" permission the first time.
 */
class UpdateInstaller(private val context: Context) {
    private val client = OkHttpClient()

    suspend fun download(url: String, onProgress: (Int) -> Unit): File {
        val request = Request.Builder().url(url).build()
        val response = client.newCall(request).execute()
        if (!response.isSuccessful) throw java.io.IOException("HTTP ${response.code}")

        val body = response.body ?: throw java.io.IOException("Empty response body")
        val total = body.contentLength()
        val outFile = File(context.cacheDir, "wimmich-update.apk")

        body.byteStream().use { input ->
            FileOutputStream(outFile).use { output ->
                val buffer = ByteArray(8192)
                var downloaded = 0L
                var read: Int
                while (input.read(buffer).also { read = it } != -1) {
                    output.write(buffer, 0, read)
                    downloaded += read
                    if (total > 0) onProgress((downloaded * 100 / total).toInt())
                }
            }
        }
        return outFile
    }

    fun canInstallUnknownApps(): Boolean =
        context.packageManager.canRequestPackageInstalls()

    /** Opens system settings so the user can grant "install unknown apps" for this app. */
    fun requestInstallPermissionIntent(): Intent =
        Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    fun installIntent(apkFile: File): Intent {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apkFile)
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }
}
