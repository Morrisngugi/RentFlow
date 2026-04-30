package com.rentflow.android.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rentflow.android.data.ApiClient
import com.rentflow.android.data.AppNotification
import com.rentflow.android.data.ComplaintItem
import com.rentflow.android.data.CreateComplaintRequest
import com.rentflow.android.data.InvoiceItem
import com.rentflow.android.data.LandlordReportData
import com.rentflow.android.data.ProfileData
import com.rentflow.android.data.RentFlowRepository
import com.rentflow.android.data.SessionStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Calendar

enum class AppRole {
    TENANT,
    LANDLORD,
    UNKNOWN,
}

data class MainUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val email: String = "",
    val password: String = "",
    val error: String? = null,
    val profile: ProfileData? = null,
    val role: AppRole = AppRole.UNKNOWN,
    val notifications: List<AppNotification> = emptyList(),
    val invoices: List<InvoiceItem> = emptyList(),
    val selectedInvoice: InvoiceItem? = null,
    val complaints: List<ComplaintItem> = emptyList(),
    val complaintLeaseId: String = "",
    val complaintTitle: String = "",
    val complaintDescription: String = "",
    val complaintType: String = "general",
    val reportMonth: Int = Calendar.getInstance().get(Calendar.MONTH) + 1,
    val reportYear: Int = Calendar.getInstance().get(Calendar.YEAR),
    val landlordReport: LandlordReportData? = null,
)

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = RentFlowRepository(ApiClient.apiService)
    private val sessionStore = SessionStore(application.applicationContext)

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        bootstrapSession()
    }

    private fun bootstrapSession() {
        viewModelScope.launch {
            val token = sessionStore.readToken()
            if (token.isNullOrBlank()) return@launch

            ApiClient.setAuthToken(token)
            runCatching { repository.getProfile() }
                .onSuccess { profile ->
                    _uiState.update {
                        it.copy(
                            isAuthenticated = true,
                            profile = profile,
                            role = profile.role.toAppRole(),
                            error = null,
                        )
                    }
                    loadRoleData()
                }
                .onFailure {
                    sessionStore.clear()
                    ApiClient.setAuthToken(null)
                }
        }
    }

    fun onEmailChanged(value: String) {
        _uiState.update { it.copy(email = value) }
    }

    fun onPasswordChanged(value: String) {
        _uiState.update { it.copy(password = value) }
    }

    fun onComplaintLeaseIdChanged(value: String) {
        _uiState.update { it.copy(complaintLeaseId = value) }
    }

    fun onComplaintTitleChanged(value: String) {
        _uiState.update { it.copy(complaintTitle = value) }
    }

    fun onComplaintDescriptionChanged(value: String) {
        _uiState.update { it.copy(complaintDescription = value) }
    }

    fun onComplaintTypeChanged(value: String) {
        _uiState.update { it.copy(complaintType = value) }
    }

    fun onReportMonthChanged(value: Int) {
        _uiState.update { it.copy(reportMonth = value.coerceIn(1, 12)) }
    }

    fun onReportYearChanged(value: Int) {
        _uiState.update { it.copy(reportYear = value.coerceIn(2000, 2100)) }
    }

    fun login() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.update { it.copy(error = "Enter email and password") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching {
                val auth = repository.login(state.email.trim(), state.password)
                sessionStore.saveToken(auth.token)
                ApiClient.setAuthToken(auth.token)
                repository.getProfile()
            }.onSuccess { profile ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        profile = profile,
                        role = profile.role.toAppRole(),
                        password = "",
                        error = null,
                    )
                }
                loadRoleData()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Login failed",
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            sessionStore.clear()
            ApiClient.setAuthToken(null)
            _uiState.value = MainUiState()
        }
    }

    fun registerPushToken(token: String) {
        if (token.isBlank() || !_uiState.value.isAuthenticated) {
            return
        }

        viewModelScope.launch {
            runCatching { repository.registerPushToken(token) }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(error = error.message ?: "Failed to register push token")
                    }
                }
        }
    }

    fun markNotificationRead(notificationId: String) {
        viewModelScope.launch {
            runCatching { repository.markNotificationRead(notificationId) }
                .onSuccess { refreshNotifications() }
        }
    }

    fun selectInvoice(invoice: InvoiceItem?) {
        _uiState.update { it.copy(selectedInvoice = invoice) }
    }

    fun submitComplaint() {
        val state = _uiState.value
        if (state.complaintLeaseId.isBlank() || state.complaintTitle.isBlank() || state.complaintDescription.isBlank()) {
            _uiState.update { it.copy(error = "Lease, title and description are required") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching {
                repository.createComplaint(
                    CreateComplaintRequest(
                        leaseId = state.complaintLeaseId.trim(),
                        title = state.complaintTitle.trim(),
                        description = state.complaintDescription.trim(),
                        complaintType = state.complaintType.trim(),
                    )
                )
            }.onSuccess {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        complaintTitle = "",
                        complaintDescription = "",
                        error = null,
                    )
                }
                refreshComplaints()
                refreshNotifications()
            }.onFailure { error ->
                _uiState.update {
                    it.copy(isLoading = false, error = error.message ?: "Could not submit complaint")
                }
            }
        }
    }

    fun refreshLandlordReport() {
        val state = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            runCatching { repository.getLandlordMonthlyReport(state.reportMonth, state.reportYear) }
                .onSuccess { report ->
                    _uiState.update { it.copy(isLoading = false, landlordReport = report, error = null) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, error = error.message ?: "Report fetch failed") }
                }
        }
    }

    fun refreshTenantData() {
        refreshNotifications()
        refreshComplaints()
        refreshInvoices()
    }

    private fun loadRoleData() {
        when (_uiState.value.role) {
            AppRole.TENANT -> refreshTenantData()
            AppRole.LANDLORD -> refreshLandlordReport()
            AppRole.UNKNOWN -> Unit
        }
    }

    private fun refreshNotifications() {
        viewModelScope.launch {
            runCatching { repository.getNotifications() }
                .onSuccess { data -> _uiState.update { it.copy(notifications = data.notifications) } }
                .onFailure { error -> _uiState.update { it.copy(error = error.message ?: "Notification fetch failed") } }
        }
    }

    private fun refreshInvoices() {
        val userId = _uiState.value.profile?.id ?: return
        viewModelScope.launch {
            runCatching { repository.getTenantInvoices(userId) }
                .onSuccess { data ->
                    _uiState.update {
                        it.copy(
                            invoices = data.invoices,
                            complaintLeaseId = it.complaintLeaseId.ifBlank { data.invoices.firstOrNull()?.leaseId ?: "" },
                        )
                    }
                }
                .onFailure { error -> _uiState.update { it.copy(error = error.message ?: "Invoice fetch failed") } }
        }
    }

    private fun refreshComplaints() {
        viewModelScope.launch {
            runCatching { repository.getMyComplaints() }
                .onSuccess { data -> _uiState.update { it.copy(complaints = data.complaints) } }
                .onFailure { error -> _uiState.update { it.copy(error = error.message ?: "Complaint fetch failed") } }
        }
    }
}

private fun String.toAppRole(): AppRole = when (lowercase()) {
    "tenant" -> AppRole.TENANT
    "landlord" -> AppRole.LANDLORD
    else -> AppRole.UNKNOWN
}
