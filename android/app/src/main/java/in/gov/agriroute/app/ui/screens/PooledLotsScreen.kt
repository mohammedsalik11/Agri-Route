package `in`.gov.agriroute.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import `in`.gov.agriroute.app.data.repository.TruckloadPool
import `in`.gov.agriroute.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PooledLotsScreen(onNavigateBack: () -> Unit) {
    val pools = AgriRouteRepository.pools
    var joinedPoolDialog by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pooled Truck Lots", fontWeight = FontWeight.Bold) },
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
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocalShipping, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Truck-Scale Collective Aggregation", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreenDark)
                            Text("By pooling with nearby farmers, you eliminate local middleman cuts and secure wholesale truckload buyers.", fontSize = 11.sp, color = InkMuted)
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Active Collective Pools Near Mandya (${pools.size})",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkText
                )
            }

            items(pools.size) { index ->
                val pool = pools[index]
                PoolCard(
                    pool = pool,
                    onJoin = {
                        pool.currentKg += 600
                        pool.memberFarmers.add("Lakshmamma (Mandya) — 600 kg")
                        if (pool.currentKg >= pool.targetKg) {
                            pool.isReady = true
                        }
                        joinedPoolDialog = "Successfully added your 600 kg ${pool.crop} to ${pool.district} Lot! Pool is now ${pool.currentKg}/${pool.targetKg} kg."
                    }
                )
            }
        }
    }

    if (joinedPoolDialog != null) {
        AlertDialog(
            onDismissRequest = { joinedPoolDialog = null },
            title = { Text("Added to Collective Pool! 🚚🌾", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = { Text(joinedPoolDialog!!) },
            confirmButton = {
                Button(
                    onClick = { joinedPoolDialog = null },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Done", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
fun PoolCard(
    pool: TruckloadPool,
    onJoin: () -> Unit
) {
    var isExpanded by remember { mutableStateOf(false) }

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
                Text(pool.crop, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = InkText)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (pool.isReady) MintLight else Color(0xFFFEF3C7)
                ) {
                    Text(
                        text = if (pool.isReady) "LOT READY" else "COLLECTING",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (pool.isReady) EarthGreen else Color(0xFFD97706),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Text("${pool.district} District · ${pool.destinationNode}", fontSize = 12.sp, color = InkMuted)

            Spacer(modifier = Modifier.height(14.dp))

            LinearProgressIndicator(
                progress = { (pool.currentKg.toFloat() / pool.targetKg).coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = EarthGreen,
                trackColor = PaperBackground
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.People, contentDescription = null, tint = InkMuted, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${pool.memberFarmers.size} Farmers", fontSize = 12.sp, color = InkText)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocalShipping, contentDescription = null, tint = InkMuted, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${pool.currentKg} / ${pool.targetKg} kg", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = InkText)
                }

                Text("₹${"%.2f".format(pool.pooledPricePerKg)}/kg", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreen)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Expandable Member Breakdown
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("View Member Farmers (${pool.memberFarmers.size})", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.SemiBold)
                Icon(
                    imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = EarthGreen,
                    modifier = Modifier.size(18.dp)
                )
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(modifier = Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    pool.memberFarmers.forEach { farmer ->
                        Text("• $farmer", fontSize = 11.sp, color = InkMuted)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onJoin,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MintLight, contentColor = EarthGreen)
            ) {
                Text("Join & Add Produce to This Pool", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}
