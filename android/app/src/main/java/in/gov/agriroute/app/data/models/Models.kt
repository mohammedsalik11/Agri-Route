package `in`.gov.agriroute.app.data.models

data class ApiResponse<T>(
    val ok: Boolean = true,
    val data: T? = null,
    val message: String? = null,
    val error: String? = null,
    val razorpayOrderId: String? = null,
    val razorpayKeyId: String? = null
)

// --- Auth & User ---
data class UserSession(
    val userId: String,
    val name: String,
    val role: String, // farmer, wholesaler, logistics_driver
    val district: String,
    val phone: String,
    val idNumber: String,
    val token: String,
    val email: String = "",
    val businessName: String = "",
    val isLoggedIn: Boolean = true
)

data class VerifyOnboardingRequest(
    val role: String,
    val name: String,
    val idNumber: String,
    val district: String,
    val state: String = "Karnataka",
    val village: String? = null,
    val landSizeAcres: Double? = null,
    val primaryCrops: List<String>? = null,
    val businessName: String? = null,
    val gstin: String? = null,
    val vehicleType: String? = null,
    val vehicleNumber: String? = null,
    val vehicleCapacityKg: Double? = null,
    val isRefrigerated: Boolean? = null,
    val language: String = "en"
)

data class UserProfileDto(
    val clerkUserId: String? = null,
    val role: String? = null,
    val name: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val language: String? = null,
    val district: String? = null,
    val state: String? = null,
    val verificationStatus: String? = null,
    val verificationSource: String? = null,
    val farmerId: String? = null,
    val village: String? = null,
    val landSizeAcres: Double? = null,
    val primaryCrops: List<String>? = null,
    val wholesalerId: String? = null,
    val businessName: String? = null,
    val gstin: String? = null,
    val driverId: String? = null,
    val vehicleType: String? = null,
    val vehicleNumber: String? = null,
    val vehicleCapacityKg: Double? = null,
    val isRefrigerated: Boolean? = null
)

// Legacy registry request for compatibility
data class VerifyRegistryRequest(
    val role: String,
    val id: String
)

data class VerifyRegistryResponse(
    val verified: Boolean,
    val name: String? = null,
    val district: String? = null,
    val state: String? = null,
    val landSizeAcres: Double? = null,
    val primaryCrops: List<String>? = null,
    val businessName: String? = null
)

// --- Listings ---
data class OnlineListingItem(
    val id: String? = null,
    val listingId: String? = null,
    val farmerId: String? = null,
    val farmerName: String? = null,
    val crop: String? = null,
    val variety: String? = null,
    val quantityKg: Double? = null,
    val askPricePerKg: Double? = null,
    val qualityGrade: String? = null,
    val qualityConfidence: Int? = null,
    val gradeSource: String? = null,
    val district: String? = null,
    val status: String? = null,
    val photoUrl: String? = null,
    val poolId: String? = null,
    val createdAt: String? = null
)

data class CreateListingRequest(
    val crop: String,
    val variety: String? = null,
    val quantityKg: Double,
    val askPricePerKg: Double, // in paise
    val qualityGrade: String = "A",
    val gradeSource: String = "self-declared",
    val photoBase64: String? = null,
    val lat: Double = 12.52,
    val lng: Double = 76.89
)

// --- Prices ---
data class MandiPriceData(
    val crop: String,
    val state: String? = "Karnataka",
    val district: String? = "Mandya",
    val mspPerKg: Double? = null,
    val mandiMinPerKg: Double = 8.0,
    val mandiModalPerKg: Double = 14.0,
    val mandiMaxPerKg: Double = 22.0,
    val mandiDate: String? = "Today",
    val mandiMarket: String? = "Mandya APMC",
    val dataSource: String? = "LIVE",
    val verdict: String? = "FAIR"
)

data class MultiPricesResponse(
    val state: String = "Karnataka",
    val district: String = "Mandya",
    val crop: String? = null,
    val mandiMinPerKg: Double? = null,
    val mandiModalPerKg: Double? = null,
    val mandiMaxPerKg: Double? = null,
    val mspPerKg: Double? = null,
    val dataSource: String? = "LIVE",
    val mandiDate: String? = "Today",
    val crops: Map<String, MandiPriceData>? = null
)

data class PriceTrendPoint(
    val date: String,
    val minPrice: Double,
    val maxPrice: Double,
    val modalPrice: Double
)

data class PriceTrendResponse(
    val crop: String,
    val district: String,
    val history: List<PriceTrendPoint> = emptyList()
)

// --- Pools ---
data class PoolLot(
    val id: String? = null,
    val poolId: String = "",
    val crop: String = "",
    val qualityGrade: String = "A",
    val district: String = "",
    val targetKg: Double = 3000.0,
    val currentKg: Double = 0.0,
    val farmerCount: Int = 0,
    val poolPricePerKg: Double = 14.0,
    val status: String = "OPEN",
    val listings: List<String> = emptyList(),
    val members: List<String> = emptyList()
)

// --- Orders & Escrow ---
data class EscrowInfo(
    val status: String = "CREATED",
    val handoverOtp: String? = null,
    val razorpayOrderId: String? = null,
    val paymentHeldAt: String? = null,
    val releasedAt: String? = null
)

data class PayoutItem(
    val farmerId: String = "",
    val farmerName: String = "",
    val quantityKg: Double = 0.0,
    val amount: Double = 0.0
)

data class OrderDto(
    val id: String? = null,
    val orderId: String = "",
    val buyerId: String = "",
    val buyerName: String = "",
    val crop: String = "",
    val quantityKg: Double = 0.0,
    val pricePerKg: Double = 0.0,
    val subtotal: Double = 0.0,
    val logisticsFee: Double = 0.0,
    val platformFee: Double = 0.0,
    val total: Double = 0.0,
    val destination: String = "",
    val destinationHub: String? = null,
    val escrow: EscrowInfo = EscrowInfo(),
    val payout: List<PayoutItem> = emptyList(),
    val driverId: String? = null,
    val driverName: String? = null,
    val createdAt: String = ""
)

data class OrderItemPayload(
    val sourceType: String, // "pool" or "listing"
    val sourceId: String
)

data class CreateOrderPayload(
    val items: List<OrderItemPayload>? = null,
    val sourceType: String? = null,
    val sourceId: String? = null,
    val destinationHub: String? = "APMC Yard, Bengaluru"
)

data class CreateOrderResponseData(
    val order: OrderDto? = null,
    val orders: List<OrderDto> = emptyList(),
    val razorpayOrderId: String? = null,
    val razorpayKeyId: String? = null
)

data class CreateOrderRequest(
    val poolId: String? = null,
    val listingId: String? = null,
    val destinationHub: String = "APMC Yard, Bengaluru",
    val transportMode: String = "shared_truck",
    val items: List<OrderItemPayload>? = null
)

data class ConfirmPaymentRequest(
    val razorpay_order_id: String,
    val razorpay_payment_id: String,
    val razorpay_signature: String = "mock"
)

data class ReleaseEscrowRequest(
    val otp: String
)

// --- Negotiations ---
data class NegotiationOfferDto(
    val id: String? = null,
    val negotiationId: String? = null,
    val listingId: String? = null,
    val poolId: String? = null,
    val farmerId: String? = null,
    val buyerId: String? = null,
    val buyerName: String? = null,
    val crop: String = "",
    val quantityKg: Double = 0.0,
    val originalPricePerKg: Double = 0.0,
    val offeredPricePerKg: Double = 0.0,
    val status: String = "PENDING", // PENDING, ACCEPTED, DECLINED, COUNTERED
    val notes: String? = null,
    val createdAt: String = ""
)

data class CreateNegotiationRequest(
    val listingId: String? = null,
    val poolId: String? = null,
    val offeredPricePerKg: Double,
    val quantityKg: Double,
    val notes: String? = null
)

data class PatchNegotiationRequest(
    val action: String, // ACCEPT, DECLINE, COUNTER
    val counterPricePerKg: Double? = null
)

// --- Logistics ---
data class LogisticsJobItem(
    val id: String = "",
    val orderId: String = "",
    val crop: String = "",
    val totalQuantityKg: Double = 0.0,
    val remainingUnassignedKg: Double = 0.0,
    val pickupDistrict: String = "Mandya",
    val deliveryDistrict: String = "Bengaluru",
    val pickupAddress: String = "Mandya Farm Hub",
    val deliveryAddress: String = "Yeshwanthpur APMC Yard",
    val estimatedDistanceKm: Double = 95.0,
    val totalLogisticsFee: Double = 1275.0,
    val status: String = "UNASSIGNED", // UNASSIGNED, ASSIGNED, IN_TRANSIT, ARRIVED, DELIVERED
    val driverId: String? = null,
    val driverName: String? = null,
    val driverPhone: String? = null,
    val vehicleNumber: String? = null,
    val otp: String? = null
)

data class PatchLogisticsRequest(
    val action: String, // ACCEPT, UPDATE_STATUS
    val status: String? = null, // ASSIGNED, EN_ROUTE_PICKUP, IN_TRANSIT, ARRIVED, DELIVERED
    val otp: String? = null
)

// --- Cold Storage ---
data class ColdStorageFacility(
    val facilityId: String,
    val name: String,
    val operator: String,
    val district: String,
    val state: String = "Karnataka",
    val lat: Double = 12.52,
    val lng: Double = 76.89,
    val totalCapacityKg: Double = 500000.0,
    val availableCapacityKg: Double = 180000.0,
    val suitableCrops: List<String> = listOf("tomato", "potato", "onion"),
    val pricePerKgPerDay: Double = 0.15,
    val contactPhone: String = "+919876543210",
    val subsidySchemeTag: String? = "AIF"
)

data class StorageBookingRequest(
    val facilityId: String,
    val crop: String,
    val quantityKg: Double,
    val days: Int,
    val startDate: String = "Tomorrow"
)

data class StorageBookingDto(
    val id: String,
    val facilityId: String,
    val facilityName: String,
    val crop: String,
    val quantityKg: Double,
    val days: Int,
    val dailyRate: Double,
    val totalCost: Double,
    val status: String = "CONFIRMED",
    val createdAt: String = ""
)

data class StorageAdviceDto(
    val recommendation: String, // HOLD, SELL
    val holdDays: Int = 5,
    val currentMandiPrice: Double,
    val projectedPrice: Double,
    val storageCost: Double,
    val netGain: Double,
    val reason: String
)

// --- Schemes ---
data class SchemeMatchDto(
    val schemeId: String,
    val name: String,
    val ministry: String = "Ministry of Agriculture & Farmers Welfare",
    val benefit: String,
    val category: String,
    val eligibilitySummary: String,
    val applyUrl: String,
    val matchScore: Int = 95,
    val matchReasons: List<String> = emptyList()
)

// --- Grading ---
data class GradingRequest(
    val photoBase64: String,
    val mimeType: String = "image/jpeg"
)

data class GradingResult(
    val grade: String = "A",
    val confidence: Double = 0.95,
    val defects: List<String> = emptyList(),
    val notes: String = "High quality produce, uniform size and coloration."
)

// --- Earnings ---
data class EarningsSummaryDto(
    val totalEarned: Double = 0.0,
    val pendingEscrow: Double = 0.0,
    val extraEarnedVsFloor: Double = 0.0,
    val directVsMiddlemanGainPct: Double = 22.5,
    val completedOrdersCount: Int = 0
)

// --- Verification ---
data class VerificationBookingRequest(
    val crop: String,
    val quantityKg: Double,
    val preferredDate: String,
    val timeSlot: String,
    val notes: String = ""
)

data class VerificationBookingDto(
    val id: String,
    val farmerId: String,
    val farmerName: String,
    val crop: String,
    val quantityKg: Double,
    val preferredDate: String,
    val timeSlot: String,
    val notes: String,
    val status: String = "CONFIRMED",
    val assignedInspector: String
)
