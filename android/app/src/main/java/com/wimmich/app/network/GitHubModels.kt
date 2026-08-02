package com.wimmich.app.network

import com.google.gson.annotations.SerializedName

data class GitHubAsset(
    val name: String,
    @SerializedName("browser_download_url") val browserDownloadUrl: String,
)

data class GitHubRelease(
    @SerializedName("tag_name") val tagName: String,
    val assets: List<GitHubAsset>,
)
