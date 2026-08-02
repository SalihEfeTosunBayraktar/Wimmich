package com.wimmich.app.update

import android.content.Context
import com.wimmich.app.network.GitHubApiService

/**
 * Checks the GitHub Releases list (not the "latest release" endpoint - the
 * server's own release tags, e.g. "v1.0.0" from services/update_service.py's
 * self-update mechanism, and this app's "android-vX" tags live in the same
 * releases list, and GitHub's "latest" is just whichever was published most
 * recently regardless of which project it belongs to) for the most recent
 * release whose tag starts with "android-v" and has a "wimmich-android.apk"
 * asset attached (uploaded by .github/workflows/android-release.yml).
 */
class UpdateChecker(context: Context, private val api: GitHubApiService = GitHubApiService.create()) {
    private val prefs = context.getSharedPreferences("wimmich_update_prefs", Context.MODE_PRIVATE)

    suspend fun checkForUpdate(): UpdateInfo? {
        val response = api.listReleases()
        if (!response.isSuccessful) return null
        val releases = response.body() ?: return null

        val androidRelease = releases.firstOrNull { it.tagName.startsWith(GitHubApiService.TAG_PREFIX) }
            ?: return null
        val asset = androidRelease.assets.firstOrNull { it.name == GitHubApiService.APK_ASSET_NAME }
            ?: return null

        val lastSeenTag = prefs.getString(KEY_LAST_SEEN_TAG, null)
        if (androidRelease.tagName == lastSeenTag) return null

        return UpdateInfo(tag = androidRelease.tagName, downloadUrl = asset.browserDownloadUrl)
    }

    /** Called once the install has actually been launched, so the same
     * release isn't offered again every time the app checks. */
    fun markSeen(tag: String) {
        prefs.edit().putString(KEY_LAST_SEEN_TAG, tag).apply()
    }

    companion object {
        private const val KEY_LAST_SEEN_TAG = "last_seen_android_release_tag"
    }
}
