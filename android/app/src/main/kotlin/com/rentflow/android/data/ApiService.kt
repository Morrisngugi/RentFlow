package com.rentflow.android.data

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

private const val BASE_URL = "https://rentflow-backend-dev.up.railway.app/api/v1/"

interface RentFlowApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiEnvelope<AuthData>

    @GET("auth/profile")
    suspend fun getProfile(): ApiEnvelope<ProfileData>

    @GET("notifications")
    suspend fun getNotifications(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): ApiEnvelope<NotificationData>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") notificationId: String): ApiEnvelope<AppNotification>

    @GET("leases/invoices/by-tenant/{tenantId}")
    suspend fun getTenantInvoices(
        @Path("tenantId") tenantId: String,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): ApiEnvelope<TenantInvoicesData>

    @GET("complaints/my-complaints")
    suspend fun getMyComplaints(): ApiEnvelope<ComplaintsData>

    @POST("complaints")
    suspend fun createComplaint(@Body request: CreateComplaintRequest): ApiEnvelope<ComplaintItem>

    @GET("payments/landlord-report")
    suspend fun getLandlordMonthlyReport(
        @Query("month") month: Int,
        @Query("year") year: Int,
    ): ApiEnvelope<LandlordReportData>
}

class AuthTokenInterceptor : Interceptor {
    @Volatile
    var token: String? = null

    override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
        val requestBuilder = chain.request().newBuilder()
        token?.let {
            requestBuilder.addHeader("Authorization", "Bearer $it")
        }
        return chain.proceed(requestBuilder.build())
    }
}

object ApiClient {
    private val authTokenInterceptor = AuthTokenInterceptor()

    val apiService: RentFlowApiService by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authTokenInterceptor)
            .addInterceptor(logging)
            .build()

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(RentFlowApiService::class.java)
    }

    fun setAuthToken(token: String?) {
        authTokenInterceptor.token = token
    }
}
