package `in`.gov.agriroute.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.gov.agriroute.app.ui.theme.*

data class FarmerOrder(
    val orderId: String,
    val crop: String,
    val quantityKg: Int,
    val ratePerKg: Double,
    val totalAmount: Double,
    val buyerName: String,
    val destination: String,
    val status: String,
    val statusLabel: String,
    val otp: String,
    val date: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerOrdersScreen(
    onNavigateBack: () -> Unit,
    onNavigateToEarnings: () -> Unit
) {
    var selectedOrderForOtp by remember { mutableStateOf<FarmerOrder?>(null) }
    var showIssueModal by remember { mutableStateOf(false) }
    var issueReported by remember { mutableStateOf(false) }

    val orders = listOf(
        FarmerOrder(
            orderId = "ORD-2026-MYS-8819",
            crop = "Tomato (Grade A)",
            quantityKg = 600,
            ratePerKg = 14.00,
            totalAmount = 8400.00,
            buyerName = "Suresh Traders (Bengaluru)",
            destination = "Yeshwanthpur APMC Yard",
            status = "in_transit",
            statusLabel = "In Transit 🚚",
            otp = "5623",
            date = "Today, 06:30 AM"
        ),
        FarmerOrder(
            orderId = "ORD-2026-HAS-4412",
            crop = "Potato (Grade A)",
            quantityKg = 1000,
            ratePerKg = 15.20,
            totalAmount = 15200.00,
            buyerName = "Mysuru Agro Mart",
            destination = "Bandipalya Mandi, Mysuru",
            status = "released",
            statusLabel = "Escrow Settled ✓",
            otp = "8921",
            date = "14 Sep 2026"
        )
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Orders & Escrow", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToEarnings) {
                        Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Earnings", tint = EarthGreen)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = PaperBackground)
            )
        },
        containerColor = PaperBackground
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                // Escrow Protection Info Banner
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MintLight,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(28.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("100% Escrow Protected Trade", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreenDark)
                            Text("Buyer funds are pre-deposited into Razorpay Escrow before farmgate pickup.", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                }
            }

            item {
                Text("Active & Past Orders (${orders.size})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
            }

            items(orders.size) { index ->
                val order = orders[index]
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(order.crop, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = InkText)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (order.status == "released") MintLight else Color(0xFFFEF3C7)
                            ) {
                                Text(
                                    text = order.statusLabel,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (order.status == "released") EarthGreen else Color(0xFFD97706),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Text("Order #${order.orderId} · ${order.date}", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Quantity", fontSize = 11.sp, color = InkMuted)
                                Text("${order.quantityKg} kg", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Column {
                                Text("Agreed Rate", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(order.ratePerKg)}/kg", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                            }
                            Column {
                                Text("Total Value", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(order.totalAmount)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Buyer: ${order.buyerName}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("Destination: ${order.destination}", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(14.dp))

                        if (order.status != "released") {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { selectedOrderForOtp = order },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                                ) {
                                    Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("View Handover OTP", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = { showIssueModal = true },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Raise Issue", fontSize = 12.sp, color = Color(0xFFE63946))
                                }
                            }
                        } else {
                            Surface(shape = RoundedCornerShape(10.dp), color = MintLight, modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("✓ Payment Released via Razorpay Route", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EarthGreenDark)
                                    TextButton(onClick = onNavigateToEarnings) {
                                        Text("Receipt", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // OTP Modal
    if (selectedOrderForOtp != null) {
        val order = selectedOrderForOtp!!
        AlertDialog(
            onDismissRequest = { selectedOrderForOtp = null },
            title = { Text("Secure Handover OTP 🔐", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Share this 4-digit code with the logistics driver when they load your produce at farmgate:")
                    Spacer(modifier = Modifier.height(6.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MintLight,
                        border = androidx.compose.foundation.BorderStroke(1.dp, MintBadge)
                    ) {
                        Text(
                            text = order.otp,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            color = EarthGreenDark,
                            letterSpacing = 8.sp,
                            modifier = Modifier.padding(horizontal = 24.dp, vertical = 10.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("⚠️ Do not share until produce is weighed and loaded.", fontSize = 11.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedOrderForOtp = null },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Done")
                }
            }
        )
    }

    // Raise Issue Dialog
    if (showIssueModal) {
        var issueText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showIssueModal = false },
            title = { Text("Escalate Dispute to Agri-Route Support", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Describe the issue (e.g. driver delayed, dispute on weighing scale, quality disagreement):")
                    OutlinedTextField(
                        value = issueText,
                        onValueChange = { issueText = it },
                        label = { Text("Dispute Details") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Escrow release is automatically frozen while support arbitrates.", fontSize = 11.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showIssueModal = false
                        issueReported = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Submit Dispute Ticket")
                }
            },
            dismissButton = {
                TextButton(onClick = { showIssueModal = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (issueReported) {
        AlertDialog(
            onDismissRequest = { issueReported = false },
            title = { Text("Ticket Filed 🛡️", fontWeight = FontWeight.Bold) },
            text = { Text("Dispute ticket #DISP-2026-9042 created. Agri-Route Mandya field officer assigned. Escrow payout is safely on hold.") },
            confirmButton = {
                Button(onClick = { issueReported = false }, colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)) {
                    Text("OK")
                }
            }
        )
    }
}
