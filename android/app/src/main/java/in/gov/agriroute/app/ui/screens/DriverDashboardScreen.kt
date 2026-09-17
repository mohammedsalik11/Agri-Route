package `in`.gov.agriroute.app.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import `in`.gov.agriroute.app.data.repository.DriverTrip
import `in`.gov.agriroute.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DriverDashboardScreen(
    onSwitchRole: () -> Unit
) {
    val context = LocalContext.current
    val activeTrip = AgriRouteRepository.activeDriverTrip.value
    val availableHauls = AgriRouteRepository.availableHauls

    var currentStep by remember { mutableStateOf(activeTrip?.step ?: "assigned") }
    var showOtpModal by remember { mutableStateOf(false) }
    var otpInput by remember { mutableStateOf("") }
    var otpError by remember { mutableStateOf(false) }
    var showPayoutReceipt by remember { mutableStateOf(false) }
    var driverWalletBalance by remember { mutableStateOf(1275.00) }
    var completedTripsCount by remember { mutableStateOf(1) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Ramesh Gowda", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = InkText)
                        Text("1.5 MT Pickup Truck · KA-11-TR-4589", fontSize = 11.sp, color = InkMuted)
                    }
                },
                actions = {
                    IconButton(onClick = onSwitchRole) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = "Switch Role", tint = EarthGreen)
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
            // Driver Wallet & Daily Performance Card
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Today's Logistics Earnings", fontSize = 12.sp, color = InkMuted)
                            Text("₹${"%.2f".format(driverWalletBalance)}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                            Text("✓ Disbursed instantly via UPI", fontSize = 11.sp, color = EarthAccent)
                        }
                        Surface(shape = RoundedCornerShape(12.dp), color = MintLight) {
                            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("$completedTripsCount", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = EarthGreenDark)
                                Text("Trips Done", fontSize = 10.sp, color = EarthGreenDark)
                            }
                        }
                    }
                }
            }

            // Active Trip Stepper Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Active Trip: ${activeTrip?.crop ?: "Tomato Lot"}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                            Text("₹${"%.2f".format(activeTrip?.payoutAmount ?: 1275.00)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                        }

                        Text(activeTrip?.route ?: "Mandya Aggregation Hub ➔ Bengaluru APMC", fontSize = 12.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(16.dp))

                        // Stepper Indicator
                        val isAssignedDone = true
                        val isInTransitDone = currentStep == "in_transit" || currentStep == "arrived" || currentStep == "delivered"
                        val isArrivedDone = currentStep == "arrived" || currentStep == "delivered"
                        val isDeliveredDone = currentStep == "delivered"

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            StepNode("Assigned", isDone = isAssignedDone)
                            StepLine(isDone = isInTransitDone)
                            StepNode("Transit", isDone = isInTransitDone)
                            StepLine(isDone = isArrivedDone)
                            StepNode("Arrived", isDone = isArrivedDone)
                            StepLine(isDone = isDeliveredDone)
                            StepNode("Settled", isDone = isDeliveredDone)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Navigation & Hub Calling Actions
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = {
                                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919876543210"))
                                    context.startActivity(dialIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Call Hub", fontSize = 12.sp, color = EarthGreen)
                            }

                            OutlinedButton(
                                onClick = {
                                    val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:12.5218,76.8951?q=Mandya+APMC+Market+Yard"))
                                    context.startActivity(mapIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("GPS Route", fontSize = 12.sp, color = EarthGreen)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Stage Progression Controls
                        when (currentStep) {
                            "assigned" -> {
                                Button(
                                    onClick = { currentStep = "in_transit" },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Start Pickup & Move In-Transit", fontWeight = FontWeight.Bold)
                                }
                            }
                            "in_transit" -> {
                                Button(
                                    onClick = { currentStep = "arrived" },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                                ) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Arrived at APMC Mandi", fontWeight = FontWeight.Bold)
                                }
                            }
                            "arrived" -> {
                                Button(
                                    onClick = { showOtpModal = true },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                                ) {
                                    Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Enter Handover OTP (5623)", fontWeight = FontWeight.Bold)
                                }
                            }
                            "delivered" -> {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MintLight,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Delivered & ₹1,275 Credited!", fontWeight = FontWeight.Bold, color = EarthGreenDark, fontSize = 13.sp)
                                        }
                                        TextButton(onClick = { showPayoutReceipt = true }) {
                                            Text("Receipt", fontWeight = FontWeight.Bold, color = EarthGreen)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Available Produce Hauls Marketplace
            item {
                Text(
                    text = "Available Produce Hauls (${availableHauls.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkText
                )
            }

            items(availableHauls.size) { index ->
                val haul = availableHauls[index]
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
                            Text(haul.crop, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                            Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                                Text("₹${"%.2f".format(haul.payoutAmount)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }

                        Text(haul.route, fontSize = 12.sp, color = InkMuted)
                        Text("Weight: ${haul.weightKg} kg (1.5 MT Vehicle Matched)", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = {
                                AgriRouteRepository.activeDriverTrip.value = haul
                                currentStep = "assigned"
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                        ) {
                            Text("Claim & Set as Active Trip", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // OTP Handover Verification Modal
    if (showOtpModal) {
        AlertDialog(
            onDismissRequest = { showOtpModal = false },
            title = { Text("Confirm Produce Handover", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ask the wholesaler agent at Bengaluru APMC for the 4-digit handover OTP.")
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedTextField(
                        value = otpInput,
                        onValueChange = {
                            otpInput = it
                            otpError = false
                        },
                        label = { Text("4-Digit OTP") },
                        placeholder = { Text("e.g. 5623") },
                        modifier = Modifier.fillMaxWidth(),
                        isError = otpError
                    )
                    if (otpError) {
                        Text("Incorrect OTP. Handover OTP is 5623", color = Color.Red, fontSize = 11.sp)
                    }
                    TextButton(
                        onClick = { otpInput = "5623" },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Auto-fill OTP (5623)", fontSize = 12.sp, color = EarthGreen)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val success = AgriRouteRepository.markDeliveryCompleted(otpInput)
                        if (success) {
                            currentStep = "delivered"
                            driverWalletBalance += 1275.00
                            completedTripsCount++
                            showOtpModal = false
                            showPayoutReceipt = true
                        } else {
                            otpError = true
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Verify & Release ₹1,275 Payout", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showOtpModal = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Logistics Payout Receipt
    if (showPayoutReceipt) {
        AlertDialog(
            onDismissRequest = { showPayoutReceipt = false },
            title = { Text("Logistics Payout Released! 🚚💰", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Trip Completed & Verified via OTP 5623", fontSize = 12.sp, color = InkMuted)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Driver Base Haul Rate:", fontSize = 12.sp)
                        Text("₹1,275.00", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("APMC Unloading Allowance:", fontSize = 12.sp, color = InkMuted)
                        Text("₹0.00", fontSize = 12.sp, color = InkMuted)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Instant Credited to UPI:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                        Text("₹1,275.00", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                    }
                    Text("UTR: RZP9948210378 · Transferred via RazorpayX", fontSize = 10.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showPayoutReceipt = false },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Done")
                }
            }
        )
    }
}

@Composable
fun StepNode(label: String, isDone: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (isDone) EarthGreen else Color.LightGray),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
        }
        Text(label, fontSize = 10.sp, color = if (isDone) EarthGreen else InkMuted, modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
fun StepLine(isDone: Boolean) {
    Box(
        modifier = Modifier
            .width(28.dp)
            .height(2.dp)
            .background(if (isDone) EarthGreen else Color.LightGray)
    )
}
