package `in`.gov.agriroute.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.gov.agriroute.app.ui.theme.*

data class SchemeItem(
    val id: String,
    val name: String,
    val benefit: String,
    val tag: String,
    val applyUrl: String
)

data class ColdStorageItem(
    val id: String,
    val name: String,
    val district: String,
    val availableKg: String,
    val totalKg: String,
    val ratePerKgDay: String,
    val phone: String,
    val recommendation: String,
    val subsidyTag: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchemesAndStorageScreen(onNavigateBack: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }
    val uriHandler = LocalUriHandler.current
    val context = LocalContext.current

    var selectedStorageForBooking by remember { mutableStateOf<ColdStorageItem?>(null) }
    var bookingSuccessMsg by remember { mutableStateOf<String?>(null) }

    val schemesList = listOf(
        SchemeItem("pm-kisan", "PM-KISAN", "₹6,000 / year direct income support transferred in 3 equal installments", "Matched for Mandya", "https://pmkisan.gov.in"),
        SchemeItem("pmfby", "PMFBY (Crop Insurance)", "Comprehensive risk insurance covering post-harvest, localized weather damage", "Mandya Horticultural", "https://pmfby.gov.in"),
        SchemeItem("kcc", "Kisan Credit Card (KCC)", "Short-term crop loans up to ₹3,00,000 at subsidized 4% interest with subvention", "Credit Matched", "https://myscheme.gov.in/schemes/kcc"),
        SchemeItem("kusum", "PM-KUSUM", "Up to 90% solar water pump subsidy and grid power installation", "Solar & Irrigation", "https://pmkusum.mnre.gov.in"),
        SchemeItem("aif", "Agriculture Infrastructure Fund (AIF)", "3% interest subvention up to ₹2 Crore for farmgate cold storages & aggregation hubs", "Cold Chain Eligible", "https://agriinfra.dac.gov.in"),
        SchemeItem("pkvy", "PKVY (Organic Farming)", "₹50,000/ha financial assistance for organic certification and biopesticides", "Soil Organic Match", "https://pgsindia-ncof.gov.in"),
        SchemeItem("smam", "SMAM Mechanization", "40-50% subsidy on rotavators, tractors, and sorting-grading machinery", "Equipment Subsidy", "https://agrimachinery.nic.in"),
        SchemeItem("shc", "Soil Health Card", "Free soil sample laboratory testing with macro & micronutrient advisories", "Mandya Taluk Free", "https://soilhealth.dac.gov.in"),
        SchemeItem("enam", "e-NAM (National Agriculture Market)", "Pan-India digital trade network linking 1,361 APMC mandis with unified license", "APMC Trade Access", "https://www.enam.gov.in"),
        SchemeItem("raitha-siri", "Raitha Siri (Karnataka)", "₹10,000 / hectare financial assistance for minor millets (Ragi, Jowar, Bajra)", "Karnataka State", "https://raitamitra.karnataka.gov.in")
    )

    val storageList = listOf(
        ColdStorageItem("cs-1", "Mandya Agri Cold Chain Hub", "Mandya", "180,000", "500,000 kg", "₹0.15 / kg / day", "+919876543210", "Hold Advice: Hold 5 days (Est. net gain +₹1.80/kg)", "AIF Subsidised"),
        ColdStorageItem("cs-2", "Mysuru Central Agro Chillers", "Mysuru", "95,000", "300,000 kg", "₹0.18 / kg / day", "+919876543211", "Suitable for Potato, Onion & Garlic preservation", "AIF Subsidised"),
        ColdStorageItem("cs-3", "Hassan Harvest Cold Depot", "Hassan", "120,000", "400,000 kg", "₹0.14 / kg / day", "+919876543212", "Equipped with humidity control for horticultural lots", "State Subsidised"),
        ColdStorageItem("cs-4", "Kolar Tomato & Fruit Vault", "Kolar", "60,000", "250,000 kg", "₹0.16 / kg / day", "+919876543213", "Hold Advice: Hold 3 days to capture weekend price spike", "AIF Subsidised")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Schemes & Cold Storage", fontWeight = FontWeight.Bold) },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = PaperBackground,
                contentColor = EarthGreen
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 }
                ) {
                    Text("Govt Schemes (${schemesList.size})", modifier = Modifier.padding(14.dp), fontWeight = FontWeight.Bold)
                }
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 }
                ) {
                    Text("Cold Storage (${storageList.size})", modifier = Modifier.padding(14.dp), fontWeight = FontWeight.Bold)
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                if (selectedTab == 0) {
                    item {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = MintLight,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text("Agristack & State Portal Linked", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreenDark)
                                    Text("All 10 schemes pre-filtered for your Mandya land parcel.", fontSize = 11.sp, color = InkMuted)
                                }
                            }
                        }
                    }

                    items(schemesList) { scheme ->
                        SchemeCard(
                            scheme = scheme,
                            onApply = { uriHandler.openUri(scheme.applyUrl) }
                        )
                    }
                } else {
                    // Hold vs Sell Advisory Banner
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
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("📈", fontSize = 18.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Hold vs Sell Advisory", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                                    }
                                    Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                                        Text("ADVICE: HOLD 5 DAYS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Mandya Tomato price is rising +₹2.20/kg over 7 days. Cold storage costs ₹0.15/kg/day (₹0.75 for 5 days).",
                                    fontSize = 12.sp,
                                    color = InkMuted,
                                    lineHeight = 16.sp
                                )

                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(shape = RoundedCornerShape(10.dp), color = MintLight, modifier = Modifier.fillMaxWidth()) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Potential Net Gain on 600kg:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = EarthGreenDark)
                                        Text("+₹870.00 (+12.4%)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                                    }
                                }
                            }
                        }
                    }

                    items(storageList) { storage ->
                        StorageCard(
                            storage = storage,
                            onCall = {
                                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${storage.phone}"))
                                context.startActivity(dialIntent)
                            },
                            onBook = {
                                selectedStorageForBooking = storage
                            }
                        )
                    }
                }
            }
        }
    }

    // Storage Booking Dialog
    if (selectedStorageForBooking != null) {
        val storage = selectedStorageForBooking!!
        var bookingKg by remember { mutableStateOf("500") }
        var bookingDays by remember { mutableStateOf("5") }

        AlertDialog(
            onDismissRequest = { selectedStorageForBooking = null },
            title = { Text("Book Cold Storage Space", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(storage.name, fontWeight = FontWeight.Bold, color = EarthGreen)
                    Text("Rate: ${storage.ratePerKgDay} · ${storage.subsidyTag}", fontSize = 12.sp, color = InkMuted)

                    Spacer(modifier = Modifier.height(4.dp))

                    OutlinedTextField(
                        value = bookingKg,
                        onValueChange = { bookingKg = it },
                        label = { Text("Produce Weight (kg)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = bookingDays,
                        onValueChange = { bookingDays = it },
                        label = { Text("Duration (Days)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    val estCost = (bookingKg.toDoubleOrNull() ?: 500.0) * (bookingDays.toDoubleOrNull() ?: 5.0) * 0.15
                    Surface(shape = RoundedCornerShape(8.dp), color = MintLight, modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Estimated Cost: ₹${"%.2f".format(estCost)} (AIF 3% rebate applicable)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = EarthGreenDark,
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val qty = bookingKg.toIntOrNull() ?: 500
                        val days = bookingDays.toIntOrNull() ?: 5
                        `in`.gov.agriroute.app.data.repository.AgriRouteRepository.bookColdStorage(
                            facilityName = storage.name,
                            crop = "Tomato",
                            quantityKg = qty,
                            days = days,
                            dailyRate = 0.15
                        )
                        bookingSuccessMsg = "Space reserved for $bookingKg kg at ${storage.name}! Facility manager notified."
                        selectedStorageForBooking = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Confirm Space Reservation", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedStorageForBooking = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Booking Success Alert
    if (bookingSuccessMsg != null) {
        AlertDialog(
            onDismissRequest = { bookingSuccessMsg = null },
            title = { Text("Reservation Confirmed! ❄️", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = { Text(bookingSuccessMsg!!) },
            confirmButton = {
                Button(
                    onClick = { bookingSuccessMsg = null },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Done")
                }
            }
        )
    }
}

@Composable
fun SchemeCard(
    scheme: SchemeItem,
    onApply: () -> Unit
) {
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
                Text(scheme.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText, modifier = Modifier.weight(1f))
                Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                    Text(scheme.tag, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(scheme.benefit, fontSize = 12.sp, color = InkMuted, lineHeight = 16.sp)

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onApply,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MintLight, contentColor = EarthGreen)
            ) {
                Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Apply on Official Portal", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun StorageCard(
    storage: ColdStorageItem,
    onCall: () -> Unit,
    onBook: () -> Unit
) {
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
                Text(storage.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText, modifier = Modifier.weight(1f))
                Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                    Text(storage.subsidyTag, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text("Available: ${storage.availableKg} / ${storage.totalKg}", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.SemiBold)
            Text("Storage Rate: ${storage.ratePerKgDay}", fontSize = 12.sp, color = InkMuted)

            Spacer(modifier = Modifier.height(8.dp))
            Surface(shape = RoundedCornerShape(8.dp), color = MintLight, modifier = Modifier.fillMaxWidth()) {
                Text(storage.recommendation, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EarthGreenDark, modifier = Modifier.padding(8.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onCall,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Call Depot", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onBook,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Icon(Icons.Default.BookmarkAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Book Space", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
