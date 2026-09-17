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
import `in`.gov.agriroute.app.data.repository.NegotiationOffer
import `in`.gov.agriroute.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerNegotiationsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToOrders: () -> Unit
) {
    val items = AgriRouteRepository.negotiations

    var showCounterModal by remember { mutableStateOf<NegotiationOffer?>(null) }
    var counterPriceInput by remember { mutableStateOf("") }
    var actionFeedback by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Price Negotiations", fontWeight = FontWeight.Bold) },
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
                        Icon(Icons.Default.Handshake, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Real-Time Fair Price Bidding", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreenDark)
                            Text("All counter-offers are guaranteed above your CACP MSP floor.", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                }
            }

            item {
                Text("Incoming Wholesaler Offers (${items.size})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
            }

            items(items.size) { index ->
                val neg = items[index]
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
                            Text(neg.crop, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = when (neg.status) {
                                    "accepted" -> MintLight
                                    "declined" -> Color(0xFFFFEAEA)
                                    else -> Color(0xFFFEF3C7)
                                }
                            ) {
                                Text(
                                    text = when (neg.status) {
                                        "accepted" -> "ACCEPTED ✓"
                                        "declined" -> "DECLINED ✕"
                                        else -> "OFFER PENDING (${neg.expiryHours}h left)"
                                    },
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = when (neg.status) {
                                        "accepted" -> EarthGreen
                                        "declined" -> Color(0xFFE63946)
                                        else -> Color(0xFFD97706)
                                    },
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Text("From: ${neg.buyerName}", fontSize = 12.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Your Ask Price", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(neg.originalPrice)}/kg", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            }
                            Column {
                                Text("Wholesaler Bid", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(neg.offeredPrice)}/kg", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                            }
                            Column {
                                Text("Total Lot Offer", fontSize = 11.sp, color = InkMuted)
                                Text("₹${"%.2f".format(neg.offeredPrice * neg.quantityKg)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        if (neg.status == "pending") {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val order = AgriRouteRepository.acceptNegotiationOffer(neg.id)
                                        actionFeedback = "Offer from ${neg.buyerName} ACCEPTED at ₹${"%.2f".format(neg.offeredPrice)}/kg! Escrow Order ${order?.id ?: ""} created and driver assigned."
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                                ) {
                                    Text("Accept Offer", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }

                                OutlinedButton(
                                    onClick = {
                                        showCounterModal = neg
                                        counterPriceInput = "%.2f".format((neg.originalPrice + neg.offeredPrice) / 2)
                                    },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Counter", fontSize = 12.sp, color = EarthGreen)
                                }

                                OutlinedButton(
                                    onClick = {
                                        AgriRouteRepository.declineNegotiationOffer(neg.id)
                                        actionFeedback = "Offer declined. Produce remains listed on open marketplace."
                                    },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Decline", fontSize = 12.sp, color = Color(0xFFE63946))
                                }
                            }
                        } else if (neg.status == "accepted") {
                            Button(
                                onClick = onNavigateToOrders,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MintLight, contentColor = EarthGreen)
                            ) {
                                Text("View Order in Escrow Tracker ➔", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // Counter Offer Modal
    if (showCounterModal != null) {
        val item = showCounterModal!!
        AlertDialog(
            onDismissRequest = { showCounterModal = null },
            title = { Text("Send Counter-Offer to Buyer", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Buyer bid is ₹${"%.2f".format(item.offeredPrice)}/kg. Propose your counter price:")
                    OutlinedTextField(
                        value = counterPriceInput,
                        onValueChange = { counterPriceInput = it },
                        label = { Text("Counter Price (₹/kg)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        actionFeedback = "Counter-offer of ₹$counterPriceInput/kg sent to ${item.buyerName}! Buyer has 4 hours to confirm."
                        showCounterModal = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Send Counter-Offer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCounterModal = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Action Feedback Alert
    if (actionFeedback != null) {
        AlertDialog(
            onDismissRequest = { actionFeedback = null },
            title = { Text("Negotiation Update 🤝", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = { Text(actionFeedback!!) },
            confirmButton = {
                Button(onClick = { actionFeedback = null }, colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)) {
                    Text("OK")
                }
            }
        )
    }
}
