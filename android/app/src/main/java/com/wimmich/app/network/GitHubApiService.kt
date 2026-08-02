package com.wimmich.app.network

import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path

/**
 * Public GitHub API, no auth needed for a public repo's release list. Kept
 * separate from ApiService/NetworkModule since this always points at
 * api.github.com regardless of the user's own (self-hosted) server URL.
 */
interface GitHubApiService {
    @GET("repos/{owner}/{repo}/releases")
    suspend fun listReleases(
        @Path("owner") owner: String = OWNER,
        @Path("repo") repo: String = REPO,
    ): Response<List<GitHubRelease>>

    companion object {
        const val OWNER = "SalihEfeTosunBayraktar"
        const val REPO = "Wimmich"

        /** Matches .github/workflows/android-release.yml's upload step. */
        const val APK_ASSET_NAME = "wimmich-android.apk"

        /** Matches the tag prefix android-release.yml triggers on - distinct
         * from the server's own release tags (e.g. "v1.0.0"). */
        const val TAG_PREFIX = "android-v"

        fun create(): GitHubApiService = Retrofit.Builder()
            .baseUrl("https://api.github.com/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GitHubApiService::class.java)
    }
}
