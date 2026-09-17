package `in`.gov.agriroute.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.gov.agriroute.app.ui.theme.*

@Composable
fun RoleSelectionScreen(
    onSelectFarmer: () -> Unit,
    onSelectWholesaler: () -> Unit,
    onSelectDriver: () -> Unit,
    onLogout: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PaperBackground)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Logo & Header
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(EarthGreen),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "🌾", fontSize = 36.sp)
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Agri Route",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = InkText
        )

        Text(
            text = "Fair prices through truck-scale collective pooling",
            fontSize = 14.sp,
            color = InkMuted,
            modifier = Modifier.padding(top = 4.dp, bottom = 32.dp)
        )

        Text(
            text = "Select your profile to continue",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = InkText,
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
        )

        RoleCard(
            title = "Farmer (ರೈತ / किसान)",
            subtitle = "List produce, join nearby truck pools & get fair mandi rates",
            icon = Icons.Default.Agriculture,
            badge = "Lakshmamma",
            onClick = onSelectFarmer
        )

        Spacer(modifier = Modifier.height(12.dp))

        RoleCard(
            title = "Wholesaler (ಖರೀದಿದಾರ / व्यापारी)",
            subtitle = "Purchase truck-scale pooled lots with verified quality & escrow",
            icon = Icons.Default.Storefront,
            badge = "Suresh Traders",
            onClick = onSelectWholesaler
        )

        Spacer(modifier = Modifier.height(12.dp))

        RoleCard(
            title = "Logistics Driver (ಚಾಲಕ / चालक)",
            subtitle = "Claim produce haul trips, track routes & earn guaranteed payouts",
            icon = Icons.Default.LocalShipping,
            badge = "Ramesh Gowda",
            onClick = onSelectDriver
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Multilingual Badge & Clerk Auth Switch
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MintLight
            ) {
                Text(
                    text = "🌐 EN · हिन्दी · ಕನ್ನಡ",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = EarthGreenDark,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                )
            }

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                modifier = Modifier.clickable { onLogout() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.AccountCircle, contentDescription = null, tint = EarthGreen, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Clerk Login", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EarthGreen)
                }
            }
        }
    }
}

@Composable
fun RoleCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    badge: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, BorderColor, RoundedCornerShape(18.dp))
            .clickable { onClick() },
        color = Color.White,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(MintLight),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = EarthGreen,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = InkText
                    )
                }
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = InkMuted,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = InkMuted,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
