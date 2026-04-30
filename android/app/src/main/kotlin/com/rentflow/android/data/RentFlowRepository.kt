package com.rentflow.android.data

class RentFlowRepository(
    private val api: RentFlowApiService,
) {
    suspend fun login(email: String, password: String): AuthData {
        val response = api.login(LoginRequest(email = email, password = password))
        return requireNotNull(response.data) {
            response.message ?: "Login failed"
        }
    }

    suspend fun getProfile(): ProfileData {
        val response = api.getProfile()
        return requireNotNull(response.data) {
            response.message ?: "Profile fetch failed"
        }
    }

    suspend fun getNotifications(): NotificationData {
        val response = api.getNotifications()
        return requireNotNull(response.data) {
            response.message ?: "Notification fetch failed"
        }
    }

    suspend fun markNotificationRead(notificationId: String) {
        api.markNotificationRead(notificationId)
    }

    suspend fun getTenantInvoices(tenantId: String): TenantInvoicesData {
        val response = api.getTenantInvoices(tenantId = tenantId)
        return requireNotNull(response.data) {
            response.message ?: "Invoice fetch failed"
        }
    }

    suspend fun getMyComplaints(): ComplaintsData {
        val response = api.getMyComplaints()
        return requireNotNull(response.data) {
            response.message ?: "Complaint fetch failed"
        }
    }

    suspend fun createComplaint(request: CreateComplaintRequest): ComplaintItem {
        val response = api.createComplaint(request)
        return requireNotNull(response.data) {
            response.message ?: "Complaint creation failed"
        }
    }

    suspend fun getLandlordMonthlyReport(month: Int, year: Int): LandlordReportData {
        val response = api.getLandlordMonthlyReport(month = month, year = year)
        return requireNotNull(response.data) {
            response.message ?: "Report fetch failed"
        }
    }
}
