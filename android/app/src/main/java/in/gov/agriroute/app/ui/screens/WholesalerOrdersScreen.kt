package `in`.gov.agriroute.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import `in`.gov.agriroute.app.data.repository.AppOrder
import `in`.gov.agriroute.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WholesalerOrdersScreen(
    onNavigateBack: () -> Unit
) {
    val orders = AgriRouteRepository.orders
    var selectedOrderForOtp by remember { mutableStateOf<AppOrder?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Purchased Orders & Escrow", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = MintLight,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Escrow Protection Guarantee", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreenDark)
                            Text("Payment is released only after you verify goods and provide OTP to driver.", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                }
            }

            item {
                Text("Your Active Purchases (${orders.size})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
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
                                color = if (order.status == "delivered") MintLight else Color(0xFFFEF3C7)
                            ) {
                                Text(
                                    text = if (order.status == "delivered") "DELIVERED ✓" else "IN TRANSIT 🚚",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (order.status == "delivered") EarthGreen else Color(0xFFD97706),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Text("Order #${order.id} · ${order.date}", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Total Weight", fontSize = 11.sp, color = InkMuted)
                                Text("${order.totalKg} kg", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Column {
                                Text("Avg Rate", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(order.ratePerKg)}/kg", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                            }
                            Column {
                                Text("Escrow Total", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(order.grandTotal)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Driver: ${order.driverName} (${order.driverVehicle})", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("Delivery Node: ${order.destination}", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = { selectedOrderForOtp = order },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                        ) {
                            Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Reveal Handover OTP (${order.otp})", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }

    if (selectedOrderForOtp != null) {
        val order = selectedOrderForOtp!!
        AlertDialog(
            onDismissRequest = { selectedOrderForOtp = null },
            title = { Text("Delivery Handover OTP 🔐", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Provide this code to driver ${order.driverName} upon unloading at APMC:")
                    Spacer(modifier = Modifier.height(4.dp))
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
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Driver entering this OTP automatically confirms handover and releases settlement.", fontSize = 11.sp, color = InkMuted)
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
}
