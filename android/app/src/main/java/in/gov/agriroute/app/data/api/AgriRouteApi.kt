package `in`.gov.agriroute.app.data.api

import `in`.gov.agriroute.app.data.models.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface AgriRouteApi {

    // --- User & Onboarding ---
    @GET("/api/me")
    suspend fun getMe(): ApiResponse<UserProfileDto>

    @POST("/api/onboarding/verify")
    suspend fun verifyOnboarding(
        @Body request: VerifyOnboardingRequest
    ): ApiResponse<UserProfileDto>

    @POST("/api/onboarding/verify")
    suspend fun verifyRegistry(
        @Body request: VerifyRegistryRequest
    ): ApiResponse<VerifyRegistryResponse>

    // --- Listings ---
    @GET("/api/listings")
    suspend fun getListings(
        @Query("crop") crop: String? = null,
        @Query("district") district: String? = null,
        @Query("status") status: String? = null,
        @Query("farmerId") farmerId: String? = null
    ): ApiResponse<List<OnlineListingItem>>

    @POST("/api/listings")
    suspend fun createListing(
        @Body request: CreateListingRequest
    ): ApiResponse<OnlineListingItem>

    // --- Prices ---
    @GET("/api/prices")
    suspend fun getPrices(
        @Query("crop") crop: String? = null,
        @Query("district") district: String = "Mandya"
    ): ApiResponse<MultiPricesResponse>

    @GET("/api/prices/trend")
    suspend fun getPriceTrend(
        @Query("crop") crop: String,
        @Query("district") district: String = "Mandya",
        @Query("days") days: Int = 7
    ): ApiResponse<PriceTrendResponse>

    // --- Pools ---
    @GET("/api/pools")
    suspend fun getPools(
        @Query("crop") crop: String? = null,
        @Query("district") district: String? = null
    ): ApiResponse<List<PoolLot>>

    @GET("/api/pools/{id}")
    suspend fun getPoolDetail(
        @Path("id") poolId: String
    ): ApiResponse<PoolLot>

    @POST("/api/pools/{id}/join")
    suspend fun joinPool(
        @Path("id") poolId: String,
        @Body request: Map<String, String>
    ): ApiResponse<PoolLot>

    // --- Orders & Escrow ---
    @GET("/api/orders")
    suspend fun getOrders(
        @Query("status") status: String? = null
    ): ApiResponse<List<OrderDto>>

    @POST("/api/orders")
    suspend fun createOrder(
        @Body request: CreateOrderRequest
    ): ApiResponse<CreateOrderResponseData>

    @GET("/api/orders/{id}")
    suspend fun getOrderDetail(
        @Path("id") orderId: String
    ): ApiResponse<OrderDto>

    @POST("/api/orders/{id}")
    suspend fun handleOrderAction(
        @Path("id") orderId: String,
        @Query("action") action: String, // generate-otp, confirm-payment
        @Body body: Any = emptyMap<String, String>()
    ): ApiResponse<OrderDto>

    @POST("/api/orders/{id}/release")
    suspend fun releaseEscrow(
        @Path("id") orderId: String,
        @Body request: ReleaseEscrowRequest
    ): ApiResponse<OrderDto>

    // --- Price Negotiations ---
    @GET("/api/negotiate")
    suspend fun getNegotiations(): ApiResponse<List<NegotiationOfferDto>>

    @POST("/api/negotiate")
    suspend fun createNegotiation(
        @Body request: CreateNegotiationRequest
    ): ApiResponse<NegotiationOfferDto>

    @PATCH("/api/negotiate/{id}")
    suspend fun respondToNegotiation(
        @Path("id") negotiationId: String,
        @Body request: PatchNegotiationRequest
    ): ApiResponse<NegotiationOfferDto>

    // --- Logistics ---
    @GET("/api/logistics")
    suspend fun getLogisticsJobs(
        @Query("status") status: String? = null,
        @Query("driverId") driverId: String? = null
    ): ApiResponse<List<LogisticsJobItem>>

    @PATCH("/api/logistics/{id}")
    suspend fun updateLogisticsJob(
        @Path("id") jobId: String,
        @Body request: PatchLogisticsRequest
    ): ApiResponse<LogisticsJobItem>

    @GET("/api/logistics/track/{orderId}")
    suspend fun trackOrderLogistics(
        @Path("orderId") orderId: String
    ): ApiResponse<LogisticsJobItem>

    // --- Cold Storage ---
    @GET("/api/storage")
    suspend fun getColdStorageFacilities(
        @Query("district") district: String? = null,
        @Query("crop") crop: String? = null
    ): ApiResponse<List<ColdStorageFacility>>

    @POST("/api/storage")
    suspend fun bookStorage(
        @Body request: StorageBookingRequest
    ): ApiResponse<StorageBookingDto>

    @GET("/api/storage/advice")
    suspend fun getStorageAdvice(
        @Query("crop") crop: String,
        @Query("quantityKg") quantityKg: Double,
        @Query("currentMandiPrice") currentMandiPrice: Double
    ): ApiResponse<StorageAdviceDto>

    // --- Schemes ---
    @GET("/api/schemes/match")
    suspend fun getMatchedSchemes(
        @Query("state") state: String = "Karnataka",
        @Query("crops") crops: String? = null,
        @Query("landSizeAcres") landSizeAcres: Double? = null,
        @Query("category") category: String? = null
    ): ApiResponse<List<SchemeMatchDto>>

    // --- Earnings ---
    @GET("/api/earnings")
    suspend fun getEarningsSummary(): ApiResponse<EarningsSummaryDto>

    // --- AI Produce Grading ---
    @POST("/api/grade")
    suspend fun gradeProduce(
        @Body request: GradingRequest
    ): ApiResponse<GradingResult>

    // --- Quality Verification ---
    @POST("/api/verification")
    suspend fun bookQualityVerification(
        @Body request: VerificationBookingRequest
    ): ApiResponse<VerificationBookingDto>

    companion object {
        var BASE_URL = "https://agri-route-red.vercel.app"

        private val okHttpClient by lazy {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            OkHttpClient.Builder()
                .addInterceptor(AuthInterceptor())
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()
        }

        val instance: AgriRouteApi by lazy {
            Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(AgriRouteApi::class.java)
        }
    }
}

