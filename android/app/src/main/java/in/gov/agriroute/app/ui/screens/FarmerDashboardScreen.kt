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
import `in`.gov.agriroute.app.data.api.AgriRouteApi
import `in`.gov.agriroute.app.data.models.MandiPriceData
import `in`.gov.agriroute.app.ui.theme.*
import kotlinx.coroutines.launch

data class SelectedPriceDetail(
    val crop: String,
    val modalPrice: String,
    val minPrice: String,
    val maxPrice: String,
    val market: String,
    val mspComparison: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerDashboardScreen(
    onNavigateToListProduce: () -> Unit,
    onNavigateToPools: () -> Unit,
    onNavigateToSchemes: () -> Unit,
    onNavigateToOrders: () -> Unit,
    onNavigateToEarnings: () -> Unit,
    onNavigateToNegotiations: () -> Unit,
    onSwitchRole: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var prices by remember { mutableStateOf<Map<String, MandiPriceData>>(emptyMap()) }
    var isLoading by remember { mutableStateOf(true) }

    var selectedPriceDetail by remember { mutableStateOf<SelectedPriceDetail?>(null) }
    var showEscrowBreakdown by remember { mutableStateOf(false) }
    var isSyncingOnline by remember { mutableStateOf(false) }

    val userSession = `in`.gov.agriroute.app.data.repository.AgriRouteRepository.currentUserSession.value
    val userName = userSession?.name ?: "Lakshmamma"
    val userDistrict = userSession?.district ?: "Mandya"

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                val res = AgriRouteApi.instance.getPrices(district = userDistrict)
                if (res.ok && res.data != null) {
                    prices = res.data.crops ?: emptyMap()
                }
                `in`.gov.agriroute.app.data.repository.AgriRouteRepository.syncOnlineListingsAndFarmers()
            } catch (e: Exception) {
                // Keep default offline data
            } finally {
                isLoading = false
                isSyncingOnline = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "🌾", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(userName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = InkText)
                            Text("$userDistrict District · Farmer (Clerk Verified)", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                isSyncingOnline = true
                                `in`.gov.agriroute.app.data.repository.AgriRouteRepository.syncOnlineListingsAndFarmers()
                                isSyncingOnline = false
                            }
                        }
                    ) {
                        if (isSyncingOnline) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = EarthGreen, strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.CloudSync, contentDescription = "Sync Live", tint = EarthGreen)
                        }
                    }

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
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Live Benchmark Price Ticker
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
                            Text(
                                text = "Today's APMC Mandi Benchmark",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkText
                            )
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = MintLight
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(EarthGreen)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("LIVE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text("Tap any crop to view 7-day Agmarknet mandi trends", fontSize = 11.sp, color = InkMuted, modifier = Modifier.padding(top = 2.dp, bottom = 10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            PricePill(
                                crop = "Tomato",
                                price = "₹14.00/kg",
                                change = "+₹1.50",
                                onClick = {
                                    selectedPriceDetail = SelectedPriceDetail(
                                        crop = "Tomato",
                                        modalPrice = "₹1,400 / quintal (₹14.00/kg)",
                                        minPrice = "₹800 / quintal",
                                        maxPrice = "₹2,200 / quintal",
                                        market = "Mandya APMC Market Yard",
                                        mspComparison = "No MSP declared — priced vs. modal benchmark"
                                    )
                                }
                            )
                            PricePill(
                                crop = "Onion",
                                price = "₹18.50/kg",
                                change = "+₹0.80",
                                onClick = {
                                    selectedPriceDetail = SelectedPriceDetail(
                                        crop = "Onion",
                                        modalPrice = "₹1,850 / quintal (₹18.50/kg)",
                                        minPrice = "₹1,200 / quintal",
                                        maxPrice = "₹2,400 / quintal",
                                        market = "Yeshwanthpur Mandi Yard",
                                        mspComparison = "No MSP declared — priced vs. modal benchmark"
                                    )
                                }
                            )
                            PricePill(
                                crop = "Potato",
                                price = "₹15.20/kg",
                                change = "-₹0.30",
                                onClick = {
                                    selectedPriceDetail = SelectedPriceDetail(
                                        crop = "Potato",
                                        modalPrice = "₹1,520 / quintal (₹15.20/kg)",
                                        minPrice = "₹1,000 / quintal",
                                        maxPrice = "₹1,900 / quintal",
                                        market = "Hassan APMC Market Yard",
                                        mspComparison = "No MSP declared — cold storage hold recommended"
                                    )
                                }
                            )
                        }
                    }
                }
            }

            // 2. Active Pool Collective Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MintLight),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(MintBadge))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "🚚 Active Tomato Pool (Mandya)",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = EarthGreenDark
                            )
                            Text("80% Full", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "2,400 kg of 3,000 kg collected. Add 600 kg to dispatch full trucklot at ₹13.72/kg!",
                            fontSize = 12.sp,
                            color = EarthGreenDark,
                            lineHeight = 16.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        LinearProgressIndicator(
                            progress = { 0.8f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = EarthGreen,
                            trackColor = Color.White
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = onNavigateToPools,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                        ) {
                            Text("View Pooled Lots & Contribute", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 3. Quick Action Grid
            item {
                Text(
                    text = "Quick Actions & Services",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkText,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ActionTile(
                            title = "List Produce",
                            subtitle = "AI Grade & Sell",
                            emoji = "📸",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToListProduce
                        )
                        ActionTile(
                            title = "Truck Pools",
                            subtitle = "Collective Lots",
                            emoji = "🚛",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToPools
                        )
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ActionTile(
                            title = "My Orders",
                            subtitle = "Escrow & OTP",
                            emoji = "📦",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToOrders
                        )
                        ActionTile(
                            title = "My Earnings",
                            subtitle = "₹8,232 & Breakdown",
                            emoji = "💰",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToEarnings
                        )
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ActionTile(
                            title = "Negotiations",
                            subtitle = "2 Active Bids",
                            emoji = "🤝",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToNegotiations
                        )
                        ActionTile(
                            title = "Govt Schemes",
                            subtitle = "12 Matched & Storage",
                            emoji = "🏛️",
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToSchemes
                        )
                    }
                }
            }

            // 4. Escrow Earnings Summary
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor)),
                    modifier = Modifier.clickable { showEscrowBreakdown = true }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total Escrow Protected Payouts", fontSize = 12.sp, color = InkMuted)
                            Text("₹8,232.00", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                            Text("✓ Disbursed via Razorpay direct to bank (Tap to view breakdown)", fontSize = 11.sp, color = EarthAccent)
                        }
                        Icon(Icons.Default.Security, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(32.dp))
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    // Price Detail Dialog
    if (selectedPriceDetail != null) {
        val detail = selectedPriceDetail!!
        AlertDialog(
            onDismissRequest = { selectedPriceDetail = null },
            title = { Text("${detail.crop} · Market Benchmark", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Market: ${detail.market}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Text("• Modal Price: ${detail.modalPrice}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                    Text("• Price Range: ${detail.minPrice} – ${detail.maxPrice}", fontSize = 12.sp, color = InkMuted)
                    Text("• Policy: ${detail.mspComparison}", fontSize = 11.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        selectedPriceDetail = null
                        onNavigateToListProduce()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("List ${detail.crop} for Sale ➔", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedPriceDetail = null }) {
                    Text("Close")
                }
            }
        )
    }

    // Escrow Payout Breakdown Dialog
    if (showEscrowBreakdown) {
        AlertDialog(
            onDismissRequest = { showEscrowBreakdown = false },
            title = { Text("Escrow Settlement Receipt 🧾", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Order Reference: ORD-2026-MYS-8819", fontSize = 12.sp, color = InkMuted)
                    Text("Buyer: Suresh Traders (Bengaluru)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Lot Total (600 kg @ ₹14.00/kg):", fontSize = 12.sp)
                        Text("₹8,400.00", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Agri-Route Platform Fee (2%):", fontSize = 12.sp, color = InkMuted)
                        Text("-₹168.00", fontSize = 12.sp, color = InkMuted)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Net Transferred to SBI A/c:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                        Text("₹8,232.00", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("UTR Ref: RZP20260916008232 · Verified by Handover OTP", fontSize = 10.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showEscrowBreakdown = false },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Done", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
fun PricePill(
    crop: String,
    price: String,
    change: String,
    onClick: () -> Unit = {}
) {
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
            .clickable { onClick() },
        color = PaperBackground
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(crop, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = InkText)
            Text(price, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
            Text(
                change,
                fontSize = 10.sp,
                color = if (change.startsWith("+")) EarthGreen else Color(0xFFE63946),
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun ActionTile(
    title: String,
    subtitle: String,
    emoji: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(16.dp))
            .clickable { onClick() },
        color = Color.White
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(emoji, fontSize = 26.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = InkText)
            Text(subtitle, fontSize = 11.sp, color = InkMuted)
        }
    }
}
