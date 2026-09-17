package `in`.gov.agriroute.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WholesalerCartScreen(
    onNavigateBack: () -> Unit,
    onOrderPlaced: (AppOrder) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val cartItems = AgriRouteRepository.cartItems

    var selectedDestination by remember { mutableStateOf("Yeshwanthpur APMC Yard, Bengaluru") }
    var selectedPaymentMethod by remember { mutableStateOf("Razorpay UPI / QR (Instant)") }
    var isProcessingPayment by remember { mutableStateOf(false) }
    var createdOrder by remember { mutableStateOf<AppOrder?>(null) }

    val produceTotal = cartItems.sumOf { it.totalAmount }
    val logisticsFee = produceTotal * 0.05
    val escrowFee = produceTotal * 0.03
    val grandTotal = produceTotal + logisticsFee + escrowFee

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Escrow Cart (${cartItems.size})", fontWeight = FontWeight.Bold) },
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
        if (cartItems.isEmpty() && createdOrder == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = InkMuted, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Your cart is empty", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = InkText)
                    Text("Browse truck-scale lots and add produce to checkout.", fontSize = 12.sp, color = InkMuted)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateBack,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                    ) {
                        Text("Browse Marketplace")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Cart Items Section
                item {
                    Text("Selected Produce Lots", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                }

                items(cartItems.size) { index ->
                    val item = cartItems[index]
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                                    Text("${item.district} District · ${item.weightKg} kg @ ₹${"%.2f".format(item.pricePerKg)}/kg", fontSize = 12.sp, color = InkMuted)
                                }
                                IconButton(onClick = { AgriRouteRepository.removeFromCart(item.id) }) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Remove", tint = Color(0xFFE63946))
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(shape = RoundedCornerShape(6.dp), color = MintLight) {
                                    Text(if (item.isFullPool) "Full Trucklot" else "Individual Lot", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                                Text("₹${"%.2f".format(item.totalAmount)}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = EarthGreenDark)
                            }
                        }
                    }
                }

                // Delivery Destination
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Delivery APMC Hub", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = InkText)
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = PaperBackground,
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(20.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(selectedDestination, fontSize = 12.sp, color = InkText, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }

                // Payment Method Selector
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Payment Gateway", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = InkText)
                            Spacer(modifier = Modifier.height(8.dp))
                            listOf("Razorpay UPI / QR (Instant)", "Escrow NetBanking (RTGS / NEFT)", "Corporate Card / Credit Line").forEach { method ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { selectedPaymentMethod = method }
                                        .padding(vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = selectedPaymentMethod == method,
                                        onClick = { selectedPaymentMethod = method },
                                        colors = RadioButtonDefaults.colors(selectedColor = EarthGreen)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(method, fontSize = 12.sp, color = InkText)
                                }
                            }
                        }
                    }
                }

                // Cost Breakdown
                item {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text("Escrow Deposit Summary", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                            Spacer(modifier = Modifier.height(12.dp))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Produce Subtotal:", fontSize = 12.sp)
                                Text("₹${"%.2f".format(produceTotal)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Transport & Aggregation (5%):", fontSize = 12.sp, color = InkMuted)
                                Text("+₹${"%.2f".format(logisticsFee)}", fontSize = 12.sp, color = InkMuted)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Escrow Protection Fee (3%):", fontSize = 12.sp, color = InkMuted)
                                Text("+₹${"%.2f".format(escrowFee)}", fontSize = 12.sp, color = InkMuted)
                            }

                            Divider(modifier = Modifier.padding(vertical = 10.dp))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Total Escrow Deposit:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                                Text("₹${"%.2f".format(grandTotal)}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = EarthGreen)
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text("🔒 Payment is safely held in Razorpay Escrow until verified delivery.", fontSize = 10.sp, color = InkMuted)
                        }
                    }
                }

                // Checkout Button
                item {
                    Button(
                        onClick = {
                            isProcessingPayment = true
                            coroutineScope.launch {
                                try {
                                    val order = AgriRouteRepository.checkoutCartOnline(selectedPaymentMethod, selectedDestination)
                                    createdOrder = order
                                } finally {
                                    isProcessingPayment = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EarthGreen),
                        enabled = !isProcessingPayment && cartItems.isNotEmpty()
                    ) {
                        if (isProcessingPayment) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Authorizing Razorpay Escrow...", color = Color.White, fontWeight = FontWeight.Bold)
                        } else {
                            Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Deposit ₹${"%.2f".format(grandTotal)} via Razorpay", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // Success Order Receipt Dialog
    if (createdOrder != null) {
        val order = createdOrder!!
        AlertDialog(
            onDismissRequest = {
                onOrderPlaced(order)
                createdOrder = null
            },
            title = { Text("Escrow Funded & Order Placed! 🎉🔒", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Order #${order.id}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("Total Produce: ${order.totalKg} kg (${order.crop})", fontSize = 12.sp)
                    Text("Escrow Total: ₹${"%.2f".format(order.grandTotal)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Text("Assigned Driver: ${order.driverName} (${order.driverVehicle})", fontSize = 12.sp, color = InkMuted)
                    
                    Surface(shape = RoundedCornerShape(8.dp), color = MintLight, modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Delivery Handover OTP: ${order.otp}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                            Text("Provide this 4-digit OTP to the driver at unloading to verify produce condition.", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val o = order
                        createdOrder = null
                        onOrderPlaced(o)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("View Active Orders ➔", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
