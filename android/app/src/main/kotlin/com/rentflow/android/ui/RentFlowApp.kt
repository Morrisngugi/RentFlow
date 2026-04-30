package com.rentflow.android.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rentflow.android.data.AppNotification
import com.rentflow.android.data.InvoiceItem
import com.rentflow.android.data.LandlordReportTenant

@Composable
fun RentFlowApp(viewModel: MainViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()

    when {
        !state.isAuthenticated -> LoginScreen(
            email = state.email,
            password = state.password,
            isLoading = state.isLoading,
            error = state.error,
            onEmailChanged = viewModel::onEmailChanged,
            onPasswordChanged = viewModel::onPasswordChanged,
            onLogin = viewModel::login,
        )

        state.role == AppRole.LANDLORD -> LandlordDashboard(
            state = state,
            onMonthChanged = viewModel::onReportMonthChanged,
            onYearChanged = viewModel::onReportYearChanged,
            onRefresh = viewModel::refreshLandlordReport,
            onLogout = viewModel::logout,
        )

        state.role == AppRole.TENANT -> TenantDashboard(
            state = state,
            onRefresh = viewModel::refreshTenantData,
            onNotificationClick = viewModel::markNotificationRead,
            onInvoiceClick = viewModel::selectInvoice,
            onCloseInvoice = { viewModel.selectInvoice(null) },
            onLeaseChanged = viewModel::onComplaintLeaseIdChanged,
            onTitleChanged = viewModel::onComplaintTitleChanged,
            onDescriptionChanged = viewModel::onComplaintDescriptionChanged,
            onTypeChanged = viewModel::onComplaintTypeChanged,
            onSubmitComplaint = viewModel::submitComplaint,
            onLogout = viewModel::logout,
        )

        else -> UnsupportedRoleScreen(onLogout = viewModel::logout)
    }
}

@Composable
private fun LoginScreen(
    email: String,
    password: String,
    isLoading: Boolean,
    error: String?,
    onEmailChanged: (String) -> Unit,
    onPasswordChanged: (String) -> Unit,
    onLogin: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("RentFlow Mobile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = email,
            onValueChange = onEmailChanged,
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChanged,
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onLogin, enabled = !isLoading, modifier = Modifier.fillMaxWidth()) {
            Text(if (isLoading) "Signing in..." else "Sign In")
        }

        if (!error.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(error, color = MaterialTheme.colorScheme.error)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LandlordDashboard(
    state: MainUiState,
    onMonthChanged: (Int) -> Unit,
    onYearChanged: (Int) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Landlord Payment Report") },
                actions = {
                    TextButton(onClick = onLogout) { Text("Logout") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = state.reportMonth.toString(),
                    onValueChange = { onMonthChanged(it.toIntOrNull() ?: state.reportMonth) },
                    label = { Text("Month") },
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = state.reportYear.toString(),
                    onValueChange = { onYearChanged(it.toIntOrNull() ?: state.reportYear) },
                    label = { Text("Year") },
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onRefresh) {
                Text("Load Report")
            }

            Spacer(modifier = Modifier.height(12.dp))
            state.landlordReport?.summary?.let { summary ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Total tenants: ${summary.totalTenants}")
                        Text("Cleared: ${summary.clearedCount}")
                        Text("Pending: ${summary.pendingCount}")
                        Text("Total due: ${summary.totalDue}")
                        Text("Total paid: ${summary.totalPaid}")
                        Text("Outstanding balance: ${summary.totalBalance}")
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.landlordReport?.tenants ?: emptyList()) { tenant ->
                    TenantReportCard(tenant)
                }
            }

            if (!state.error.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(state.error, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun TenantReportCard(tenant: LandlordReportTenant) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(tenant.tenantName, fontWeight = FontWeight.Bold)
            Text(tenant.propertyName)
            Text("Status: ${tenant.paymentStatus.uppercase()}")
            Text("Due: ${tenant.invoice?.totalDue ?: 0.0}")
            Text("Paid: ${tenant.invoice?.amountPaid ?: 0.0}")
            Text("Balance: ${tenant.invoice?.balance ?: 0.0}")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TenantDashboard(
    state: MainUiState,
    onRefresh: () -> Unit,
    onNotificationClick: (String) -> Unit,
    onInvoiceClick: (InvoiceItem) -> Unit,
    onCloseInvoice: () -> Unit,
    onLeaseChanged: (String) -> Unit,
    onTitleChanged: (String) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onTypeChanged: (String) -> Unit,
    onSubmitComplaint: () -> Unit,
    onLogout: () -> Unit,
) {
    var tabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Invoices", "Notifications", "Complaints")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tenant Dashboard") },
                actions = {
                    TextButton(onClick = onRefresh) { Text("Refresh") }
                    TextButton(onClick = onLogout) { Text("Logout") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = tabIndex) {
                tabs.forEachIndexed { index, label ->
                    Tab(selected = tabIndex == index, onClick = { tabIndex = index }, text = { Text(label) })
                }
            }

            when (tabIndex) {
                0 -> InvoiceTab(state.invoices, onInvoiceClick)
                1 -> NotificationsTab(state.notifications, onNotificationClick)
                2 -> ComplaintsTab(
                    state = state,
                    onLeaseChanged = onLeaseChanged,
                    onTitleChanged = onTitleChanged,
                    onDescriptionChanged = onDescriptionChanged,
                    onTypeChanged = onTypeChanged,
                    onSubmitComplaint = onSubmitComplaint,
                )
            }

            if (!state.error.isNullOrBlank()) {
                Text(
                    text = state.error,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(12.dp),
                )
            }
        }

        state.selectedInvoice?.let { invoice ->
            AlertDialog(
                onDismissRequest = onCloseInvoice,
                title = { Text("Invoice Details") },
                text = {
                    Column {
                        Text("Month/Year: ${invoice.month}/${invoice.year}")
                        Text("Lease: ${invoice.leaseId}")
                        Text("Total Due: ${invoice.totalDue}")
                        Text("Amount Paid: ${invoice.amountPaid}")
                        Text("Balance: ${invoice.balanceRemaining}")
                        Text("Status: ${invoice.status}")
                    }
                },
                confirmButton = {
                    Button(onClick = onCloseInvoice) { Text("Close") }
                }
            )
        }
    }
}

@Composable
private fun InvoiceTab(
    invoices: List<InvoiceItem>,
    onInvoiceClick: (InvoiceItem) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(invoices) { invoice ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onInvoiceClick(invoice) }
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Invoice ${invoice.month}/${invoice.year}", fontWeight = FontWeight.Bold)
                    Text("Due: ${invoice.totalDue}")
                    Text("Paid: ${invoice.amountPaid}")
                    Text("Balance: ${invoice.balanceRemaining}")
                    Text("Status: ${invoice.status}")
                }
            }
        }
    }
}

@Composable
private fun NotificationsTab(
    notifications: List<AppNotification>,
    onNotificationClick: (String) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(notifications) { notification ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNotificationClick(notification.id) }
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(notification.title, fontWeight = FontWeight.Bold)
                    Text(notification.message)
                    Text("Type: ${notification.notificationType}")
                    Text(if (notification.isRead) "Read" else "Tap to open and mark as read")
                }
            }
        }
    }
}

@Composable
private fun ComplaintsTab(
    state: MainUiState,
    onLeaseChanged: (String) -> Unit,
    onTitleChanged: (String) -> Unit,
    onDescriptionChanged: (String) -> Unit,
    onTypeChanged: (String) -> Unit,
    onSubmitComplaint: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item {
            Text("Raise Complaint", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = state.complaintLeaseId,
                onValueChange = onLeaseChanged,
                label = { Text("Lease ID") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.complaintType,
                onValueChange = onTypeChanged,
                label = { Text("Complaint Type") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.complaintTitle,
                onValueChange = onTitleChanged,
                label = { Text("Title") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.complaintDescription,
                onValueChange = onDescriptionChanged,
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = onSubmitComplaint) {
                Text("Submit Complaint")
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text("Complaint Progress", style = MaterialTheme.typography.titleMedium)
        }

        items(state.complaints) { complaint ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(complaint.title, fontWeight = FontWeight.Bold)
                    Text("Type: ${complaint.complaintType}")
                    Text("Status: ${complaint.status}")
                    Text(complaint.description)
                }
            }
        }
    }
}

@Composable
private fun UnsupportedRoleScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("This mobile build currently supports tenant and landlord roles.")
        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = onLogout) {
            Text("Logout")
        }
    }
}
