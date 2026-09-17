package `in`.gov.agriroute.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import `in`.gov.agriroute.app.data.repository.CartItem
import `in`.gov.agriroute.app.data.repository.FarmerProduceListing
import `in`.gov.agriroute.app.data.repository.TruckloadPool
import `in`.gov.agriroute.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WholesalerMarketplaceScreen(
    onNavigateToCart: () -> Unit,
    onNavigateToOrders: () -> Unit,
    onSwitchRole: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val pools = AgriRouteRepository.pools
    val individualListings = AgriRouteRepository.listings
    val cartCount = AgriRouteRepository.cartItems.size

    var selectedTab by remember { mutableStateOf(0) } // 0 = Full Truckload Pools, 1 = Individual Farmer Lots
    var selectedCropFilter by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }
    var addedFeedback by remember { mutableStateOf<String?>(null) }
    var offerForPool by remember { mutableStateOf<TruckloadPool?>(null) }
    var offerForListing by remember { mutableStateOf<FarmerProduceListing?>(null) }
    var offerBidPrice by remember { mutableStateOf("") }
    var isSyncingOnline by remember { mutableStateOf(false) }

    val userSession = AgriRouteRepository.currentUserSession.value
    val userName = userSession?.name ?: "Suresh Traders"
    val userDistrict = userSession?.district ?: "Bengaluru Urban"

    val cropFilters = listOf("All", "Tomato", "Onion", "Potato", "Ragi", "Paddy")

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            try {
                isSyncingOnline = true
                AgriRouteRepository.syncOnlineListingsAndFarmers()
            } catch (e: Exception) {
                // Ignore offline errors
            } finally {
                isSyncingOnline = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(userName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = InkText)
                        Text("Wholesaler · $userDistrict (Clerk Verified)", fontSize = 11.sp, color = InkMuted)
                    }
                },
                actions = {
                    // Online Sync Button
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                isSyncingOnline = true
                                AgriRouteRepository.syncOnlineListingsAndFarmers()
                                isSyncingOnline = false
                            }
                        }
                    ) {
                        if (isSyncingOnline) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = EarthGreen, strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.CloudSync, contentDescription = "Sync Live Produce", tint = EarthGreen)
                        }
                    }

                    // Orders button
                    IconButton(onClick = onNavigateToOrders) {
                        Icon(Icons.Default.ReceiptLong, contentDescription = "Orders", tint = EarthGreen)
                    }

                    // Cart with badge
                    Box(modifier = Modifier.padding(end = 4.dp)) {
                        IconButton(onClick = onNavigateToCart) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = "Cart", tint = EarthGreen)
                        }
                        if (cartCount > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 4.dp, end = 4.dp)
                                    .size(18.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE63946)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$cartCount",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // View Mode Tab (Truckload Pools vs Individual Lots)
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = PaperBackground,
                contentColor = EarthGreen
            ) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                    Text("Truckload Pools (${pools.size})", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                }
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                    Text("Individual Lots (${individualListings.size})", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Search Bar
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by crop, grade or district...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = InkMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = Color.White, focusedContainerColor = Color.White)
                    )
                }

                // Crop Filter Chips
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        cropFilters.take(4).forEach { crop ->
                            FilterChip(
                                selected = selectedCropFilter == crop,
                                onClick = { selectedCropFilter = crop },
                                label = { Text(crop, fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MintLight,
                                    selectedLabelColor = EarthGreen
                                )
                            )
                        }
                    }
                }

                if (selectedTab == 0) {
                    // TRUCKLOAD POOLS
                    item {
                        Text("Collective Truck-Scale Lots (Aggregated)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                    }

                    val filteredPools = pools.filter {
                        (selectedCropFilter == "All" || it.crop.contains(selectedCropFilter, ignoreCase = true)) &&
                        (searchQuery.isEmpty() || it.crop.contains(searchQuery, ignoreCase = true) || it.district.contains(searchQuery, ignoreCase = true))
                    }

                    items(filteredPools.size) { index ->
                        val pool = filteredPools[index]
                        WholesalerPoolCard(
                            pool = pool,
                            onAddToCart = {
                                AgriRouteRepository.addToCart(
                                    CartItem(
                                        id = pool.id,
                                        title = pool.crop,
                                        crop = pool.crop,
                                        weightKg = pool.currentKg,
                                        pricePerKg = pool.pooledPricePerKg,
                                        isFullPool = true,
                                        district = pool.district
                                    )
                                )
                                addedFeedback = "Added ${pool.currentKg} kg ${pool.crop} to your Escrow Cart!"
                            },
                            onBuyNow = {
                                AgriRouteRepository.addToCart(
                                    CartItem(
                                        id = pool.id,
                                        title = pool.crop,
                                        crop = pool.crop,
                                        weightKg = pool.currentKg,
                                        pricePerKg = pool.pooledPricePerKg,
                                        isFullPool = true,
                                        district = pool.district
                                    )
                                )
                                onNavigateToCart()
                            },
                            onMakeOffer = {
                                offerForPool = pool
                                offerBidPrice = "%.2f".format(pool.pooledPricePerKg * 0.95)
                            }
                        )
                    }
                } else {
                    // INDIVIDUAL FARMER LOTS
                    item {
                        Text("Individual Verified Produce Lots", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                    }

                    val filteredListings = individualListings.filter {
                        (selectedCropFilter == "All" || it.crop.contains(selectedCropFilter, ignoreCase = true)) &&
                        (searchQuery.isEmpty() || it.crop.contains(searchQuery, ignoreCase = true) || it.farmerName.contains(searchQuery, ignoreCase = true) || it.district.contains(searchQuery, ignoreCase = true))
                    }

                    items(filteredListings.size) { index ->
                        val listing = filteredListings[index]
                        WholesalerIndividualLotCard(
                            listing = listing,
                            onAddToCart = {
                                AgriRouteRepository.addToCart(
                                    CartItem(
                                        id = listing.id,
                                        title = "${listing.emoji} ${listing.crop} (${listing.qualityGrade})",
                                        crop = listing.crop,
                                        weightKg = listing.quantityKg,
                                        pricePerKg = listing.askPricePerKg,
                                        isFullPool = false,
                                        district = listing.district
                                    )
                                )
                                addedFeedback = "Added ${listing.quantityKg} kg ${listing.crop} from ${listing.farmerName} to Cart!"
                            },
                            onBuyNow = {
                                AgriRouteRepository.addToCart(
                                    CartItem(
                                        id = listing.id,
                                        title = "${listing.emoji} ${listing.crop} (${listing.qualityGrade})",
                                        crop = listing.crop,
                                        weightKg = listing.quantityKg,
                                        pricePerKg = listing.askPricePerKg,
                                        isFullPool = false,
                                        district = listing.district
                                    )
                                )
                                onNavigateToCart()
                            },
                            onMakeOffer = {
                                offerForListing = listing
                                offerBidPrice = "%.2f".format(listing.askPricePerKg * 0.95)
                            }
                        )
                    }
                }
            }
        }
    }

    // Offer Modal for Pool
    if (offerForPool != null) {
        val pool = offerForPool!!
        val bidPrice = offerBidPrice.toDoubleOrNull() ?: pool.pooledPricePerKg
        AlertDialog(
            onDismissRequest = { offerForPool = null },
            title = { Text("Make Offer on Truckload Pool 🤝", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${pool.crop} · ${pool.currentKg} kg aggregated in ${pool.district}")
                    Text("Listed Price: ₹${"%.2f".format(pool.pooledPricePerKg)}/kg", fontSize = 12.sp, color = InkMuted)
                    OutlinedTextField(
                        value = offerBidPrice,
                        onValueChange = { offerBidPrice = it },
                        label = { Text("Your Bid Price (₹/kg)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Total Offer Amount: ₹${"%.2f".format(bidPrice * pool.currentKg)}", fontWeight = FontWeight.Bold, color = EarthGreen)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        AgriRouteRepository.makeNegotiationOffer(
                            buyerName = "Suresh Traders (Bengaluru)",
                            crop = pool.crop,
                            quantityKg = pool.currentKg,
                            originalPrice = pool.pooledPricePerKg,
                            offeredPrice = bidPrice,
                            listingId = pool.id
                        )
                        offerForPool = null
                        addedFeedback = "Counter-offer of ₹${"%.2f".format(bidPrice)}/kg submitted to pool members! Notification sent."
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Submit Offer")
                }
            },
            dismissButton = {
                TextButton(onClick = { offerForPool = null }) { Text("Cancel") }
            }
        )
    }

    // Offer Modal for Individual Lot
    if (offerForListing != null) {
        val listing = offerForListing!!
        val bidPrice = offerBidPrice.toDoubleOrNull() ?: listing.askPricePerKg
        AlertDialog(
            onDismissRequest = { offerForListing = null },
            title = { Text("Make Offer to Farmer 🤝", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${listing.crop} · ${listing.quantityKg} kg from ${listing.farmerName}")
                    Text("Farmer Ask Price: ₹${"%.2f".format(listing.askPricePerKg)}/kg", fontSize = 12.sp, color = InkMuted)
                    OutlinedTextField(
                        value = offerBidPrice,
                        onValueChange = { offerBidPrice = it },
                        label = { Text("Your Bid Price (₹/kg)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Total Offer Amount: ₹${"%.2f".format(bidPrice * listing.quantityKg)}", fontWeight = FontWeight.Bold, color = EarthGreen)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        AgriRouteRepository.makeNegotiationOffer(
                            buyerName = "Suresh Traders (Bengaluru)",
                            crop = listing.crop,
                            quantityKg = listing.quantityKg,
                            originalPrice = listing.askPricePerKg,
                            offeredPrice = bidPrice,
                            listingId = listing.id
                        )
                        offerForListing = null
                        addedFeedback = "Counter-offer of ₹${"%.2f".format(bidPrice)}/kg sent to ${listing.farmerName}! Awaiting response."
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Submit Offer")
                }
            },
            dismissButton = {
                TextButton(onClick = { offerForListing = null }) { Text("Cancel") }
            }
        )
    }

    if (addedFeedback != null) {
        AlertDialog(
            onDismissRequest = { addedFeedback = null },
            title = { Text("Agri Route Marketplace ✨", fontWeight = FontWeight.Bold, color = EarthGreen) },
            text = { Text(addedFeedback!!) },
            confirmButton = {
                Button(
                    onClick = {
                        addedFeedback = null
                        onNavigateToCart()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Text("Go to Cart ➔", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { addedFeedback = null }) {
                    Text("Keep Shopping")
                }
            }
        )
    }
}

@Composable
fun WholesalerPoolCard(
    pool: TruckloadPool,
    onAddToCart: () -> Unit,
    onBuyNow: () -> Unit,
    onMakeOffer: () -> Unit
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
                Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                    Text("Grade A · AI Verified", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }

            Text("${pool.district} District · ${pool.destinationNode}", fontSize = 12.sp, color = InkMuted)

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Aggregated Weight", fontSize = 11.sp, color = InkMuted)
                    Text("${pool.currentKg} / ${pool.targetKg} kg", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = InkText)
                }
                Column {
                    Text("Rate", fontSize = 11.sp, color = InkMuted)
                    Text("₹${"%.2f".format(pool.pooledPricePerKg)}/kg", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                }
                Column {
                    Text("Produce Total", fontSize = 11.sp, color = InkMuted)
                    Text("₹${"%.2f".format(pool.currentKg * pool.pooledPricePerKg)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                }
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
                Text("Member Farmers (${pool.memberFarmers.size})", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.SemiBold)
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

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onAddToCart,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Cart", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onMakeOffer,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Handshake, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Offer", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onBuyNow,
                    modifier = Modifier.weight(1.2f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Buy Now", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun WholesalerIndividualLotCard(
    listing: FarmerProduceListing,
    onAddToCart: () -> Unit,
    onBuyNow: () -> Unit,
    onMakeOffer: () -> Unit
) {
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(listing.emoji, fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("${listing.crop} (${listing.qualityGrade})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = InkText)
                }
                Surface(shape = RoundedCornerShape(8.dp), color = MintLight) {
                    Text("${listing.qualityConfidence}% Quality", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EarthGreen, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }

            Text("Farmer: ${listing.farmerName} · ${listing.district} District · Listed ${listing.dateListed}", fontSize = 12.sp, color = InkMuted)

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Lot Quantity", fontSize = 11.sp, color = InkMuted)
                    Text("${listing.quantityKg} kg", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Column {
                    Text("Ask Rate", fontSize = 11.sp, color = InkMuted)
                    Text("₹${"%.2f".format(listing.askPricePerKg)}/kg", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = EarthGreen)
                }
                Column {
                    Text("Lot Value", fontSize = 11.sp, color = InkMuted)
                    Text("₹${"%.2f".format(listing.quantityKg * listing.askPricePerKg)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = EarthGreenDark)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onAddToCart,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Cart", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onMakeOffer,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Handshake, contentDescription = null, modifier = Modifier.size(14.dp), tint = EarthGreen)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Offer", fontSize = 12.sp, color = EarthGreen, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onBuyNow,
                    modifier = Modifier.weight(1.2f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EarthGreen)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Buy Now", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
