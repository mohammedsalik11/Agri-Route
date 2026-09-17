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
import `in`.gov.agriroute.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerEarningsScreen(
    onNavigateBack: () -> Unit
) {
    var showReceiptDetail by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Earnings & Payouts", fontWeight = FontWeight.Bold) },
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
            // 1. Earnings Hero Card
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("Total Escrow Protected Earnings", fontSize = 12.sp, color = InkMuted)
                        Text("₹8,232.00", fontSize = 30.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                        
                        Spacer(modifier = Modifier.height(6.dp))

                        Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                            Text(
                                text = "🎉 +₹1,512.00 (+22.5%) more vs traditional middleman floor!",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = EarthGreenDark,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Divider(color = BorderColor)
                        Spacer(modifier = Modifier.height(14.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Bank Account", fontSize = 11.sp, color = InkMuted)
                                Text("SBI · ···4417", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Column {
                                Text("Last Payout", fontSize = 11.sp, color = InkMuted)
                                Text("Today, 07:15 AM", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Column {
                                Text("Status", fontSize = 11.sp, color = InkMuted)
                                Text("Settled ✓", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                            }
                        }
                    }
                }
            }

            // 2. Direct Value Comparison: Agri-Route vs Traditional Middlemen
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text("Where Does Your Rupee Go?", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                        Text("Agri-Route direct collective model vs traditional 4-tier commission agents", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(16.dp))

                        // Agri-Route Bar
                        Text("Agri-Route Collective Model (Farmer gets ~72%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth().height(22.dp).clip(RoundedCornerShape(6.dp))) {
                            Box(modifier = Modifier.weight(0.72f).fillMaxHeight().background(EarthGreen), contentAlignment = Alignment.Center) {
                                Text("Farmer 72%", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Box(modifier = Modifier.weight(0.05f).fillMaxHeight().background(Color(0xFF40916C)))
                            Box(modifier = Modifier.weight(0.03f).fillMaxHeight().background(Color(0xFF52B788)))
                            Box(modifier = Modifier.weight(0.20f).fillMaxHeight().background(Color(0xFFD8F3DC)), contentAlignment = Alignment.Center) {
                                Text("Retail 20%", color = EarthGreenDark, fontSize = 9.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Traditional Chain Bar
                        Text("Traditional Supply Chain (Farmer gets ~30%)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFE63946))
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth().height(22.dp).clip(RoundedCornerShape(6.dp))) {
                            Box(modifier = Modifier.weight(0.30f).fillMaxHeight().background(Color(0xFFE63946)), contentAlignment = Alignment.Center) {
                                Text("Farmer 30%", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Box(modifier = Modifier.weight(0.70f).fillMaxHeight().background(Color(0xFFFFD1D1)), contentAlignment = Alignment.Center) {
                                Text("Middlemen & Commission Agents 70%", color = Color(0xFF900C3F), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 3. Payout Receipts
            item {
                Text("Settlement Receipts", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
            }

            item {
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
                            Text("Tomato 600 kg Lot #8819", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("₹8,232.00", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = EarthGreen)
                        }

                        Text("Buyer: Suresh Traders · UTR: RZP20260916008232", fontSize = 11.sp, color = InkMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = { showReceiptDetail = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MintLight, contentColor = EarthGreen)
                        ) {
                            Icon(Icons.Default.ReceiptLong, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("View Detailed Tax & Fee Receipt", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    if (showReceiptDetail) {
        AlertDialog(
            onDismissRequest = { showReceiptDetail = false },
            title = { Text("Tax Invoice & Payout Receipt 🧾", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Farmer: Lakshmamma (Mandya)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("Buyer: Suresh Traders (GSTIN: 29AABCS1429B1Z8)", fontSize = 11.sp, color = InkMuted)
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Gross Produce (600 kg @ ₹14.00):", fontSize = 12.sp)
                        Text("₹8,400.00", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Agri-Route Escrow Fee (2%):", fontSize = 12.sp, color = InkMuted)
                        Text("-₹168.00", fontSize = 12.sp, color = InkMuted)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("APMC Market Cess (0% Direct Farmer):", fontSize = 12.sp, color = InkMuted)
                        Text("₹0.00", fontSize = 12.sp, color = InkMuted)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Net Payout Credited to SBI:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                        Text("₹8,232.00", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Settlement Method: Razorpay Route Payouts (Automated on OTP Verification)", fontSize = 10.sp, color = InkMuted)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showReceiptDetail = false },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Close")
                }
            }
        )
    }
}
