package com.wimmich.app.network

import com.google.gson.annotations.SerializedName

data class LoginRequest(val email: String, val password: String)

data class LoginUser(
    val id: String,
    val email: String,
    val name: String?,
    @SerializedName("is_admin") val isAdmin: Boolean,
)

data class LoginResponse(
    val token: String?,
    val user: LoginUser?,
    // 2FA-enabled accounts return a challenge instead of a token on first
    // login (see auth_router.py's /2fa/login-verify) - not handled in this
    // Phase 1 pass, surfaced as a plain login error for now.
    val message: String? = null,
)

data class CreateApiKeyRequest(
    val name: String,
    @SerializedName("expires_in_days") val expiresInDays: Int? = null,
)

data class ApiKeyResponse(
    val id: String,
    val name: String,
    val key: String,
    @SerializedName("key_prefix") val keyPrefix: String,
)

data class Asset(
    val id: String,
    @SerializedName("file_name") val fileName: String,
    @SerializedName("file_type") val fileType: String,
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("taken_at") val takenAt: String?,
    @SerializedName("is_favorite") val isFavorite: Boolean,
    @SerializedName("thumb_small") val thumbSmall: String?,
    @SerializedName("thumb_medium") val thumbMedium: String?,
    @SerializedName("file_url") val fileUrl: String?,
)

data class AssetGroup(
    @SerializedName("display_date") val displayDate: String?,
    val assets: List<Asset>,
)

data class GalleryResponse(
    val groups: List<AssetGroup>,
    val page: Int,
    @SerializedName("total_pages") val totalPages: Int,
)

data class UploadResult(
    @SerializedName("file_name") val fileName: String,
    val status: String,
    @SerializedName("existing_id") val existingId: String? = null,
)

data class UploadError(
    @SerializedName("file_name") val fileName: String,
    val error: String,
    val retryable: Boolean = false,
)

data class UploadResponse(
    val results: List<UploadResult>,
    val errors: List<UploadError>,
)
