package com.wimmich.app.network

import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Query
import retrofit2.http.Streaming
import retrofit2.http.Url

/**
 * Mirrors the endpoints the web SPA already relies on (static/js/api.js) -
 * no backend changes were needed for this app. Base URL is per-user (a
 * self-hosted server), set at runtime via RetrofitFactory, not baked in here.
 */
interface ApiService {

    @POST("api/auth/login")
    suspend fun login(@Body req: LoginRequest): Response<LoginResponse>

    @POST("api/auth/api-keys")
    suspend fun createApiKey(@Body req: CreateApiKeyRequest): Response<ApiKeyResponse>

    @GET("api/assets/gallery")
    suspend fun getGallery(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 60,
        @Query("sort_by") sortBy: String = "date_desc",
    ): Response<GalleryResponse>

    @Multipart
    @POST("api/assets/upload")
    suspend fun uploadAssets(
        @Part files: List<MultipartBody.Part>,
        @Part("last_modified") lastModified: List<String>,
        @Part("checksums") checksums: List<String>,
    ): Response<UploadResponse>

    @POST("api/assets/process-pending")
    suspend fun processPending(): Response<Unit>

    // Thumbnails/full files are plain authenticated GETs - Coil's ImageLoader
    // uses the same OkHttpClient (with AuthInterceptor) directly rather than
    // going through this Retrofit interface, so no method is needed here for
    // those; this one is only used for a lightweight reachability check.
    @Streaming
    @GET
    suspend fun ping(@Url url: String): Response<ResponseBody>
}
