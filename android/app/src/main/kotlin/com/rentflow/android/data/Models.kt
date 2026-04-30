package com.rentflow.android.data

data class ApiEnvelope<T>(
    val success: Boolean? = null,
    val message: String? = null,
    val data: T? = null,
)

data class AuthData(
    val user: UserSummary,
    val token: String,
    val expiresIn: String,
)

data class UserSummary(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
)

data class ProfileData(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val role: String,
    val isActive: Boolean = true,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class NotificationData(
    val notifications: List<AppNotification>,
    val unreadCount: Int,
    val total: Int,
)

data class AppNotification(
    val id: String,
    val title: String,
    val message: String,
    val notificationType: String,
    val relatedEntityId: String? = null,
    val relatedEntityType: String? = null,
    val isRead: Boolean,
    val createdAt: String,
)

data class TenantInvoicesData(
    val invoices: List<InvoiceItem>,
    val total: Int,
    val limit: Int,
    val offset: Int,
    val hasMore: Boolean,
)

data class InvoiceItem(
    val id: String,
    val leaseId: String,
    val month: Int,
    val year: Int,
    val totalDue: Double,
    val amountPaid: Double,
    val balanceRemaining: Double,
    val status: String,
    val dueDate: String? = null,
)

data class ComplaintsData(
    val complaints: List<ComplaintItem>,
    val count: Int,
)

data class ComplaintItem(
    val id: String,
    val leaseId: String,
    val title: String,
    val description: String,
    val complaintType: String,
    val status: String,
    val createdAt: String,
)

data class CreateComplaintRequest(
    val leaseId: String,
    val title: String,
    val description: String,
    val complaintType: String,
    val attachmentUrls: List<String> = emptyList(),
)

data class LandlordReportData(
    val month: Int,
    val year: Int,
    val summary: LandlordReportSummary,
    val tenants: List<LandlordReportTenant>,
)

data class LandlordReportSummary(
    val totalTenants: Int,
    val clearedCount: Int,
    val pendingCount: Int,
    val totalDue: Double,
    val totalPaid: Double,
    val totalBalance: Double,
)

data class LandlordReportTenant(
    val leaseId: String,
    val tenantId: String,
    val tenantName: String,
    val tenantPhone: String? = null,
    val propertyId: String,
    val propertyName: String,
    val invoice: LandlordInvoiceData? = null,
    val paymentStatus: String,
)

data class LandlordInvoiceData(
    val invoiceId: String,
    val month: Int,
    val year: Int,
    val totalDue: Double,
    val amountPaid: Double,
    val balance: Double,
    val status: String,
    val dueDate: String? = null,
)
