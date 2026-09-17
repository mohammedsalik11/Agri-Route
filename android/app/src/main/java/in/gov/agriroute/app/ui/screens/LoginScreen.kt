package `in`.gov.agriroute.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.gov.agriroute.app.data.api.AgriRouteApi
import `in`.gov.agriroute.app.data.models.VerifyOnboardingRequest
import `in`.gov.agriroute.app.data.models.UserSession
import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import `in`.gov.agriroute.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: (role: String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()

    var selectedTab by remember { mutableStateOf(0) } // 0 = Sign In, 1 = Register & Verify
    var selectedRole by remember { mutableStateOf("farmer") }

    var identifierInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var nameInput by remember { mutableStateOf("") }
    var districtInput by remember { mutableStateOf("Mandya") }
    var phoneInput by remember { mutableStateOf("") }

    var isVerifyingOnline by remember { mutableStateOf(false) }
    var verificationStatus by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun getRoleLabel(): String {
        return when (selectedRole) {
            "farmer" -> "Farmer ID (e.g. KA-MAN-2026-004417)"
            "wholesaler" -> "Wholesaler ID (e.g. WS-KA-2026-1183)"
            else -> "Driver / Vehicle ID (e.g. DRV-KA-2026-1042)"
        }
    }

    fun handleClerkAuth() {
        val trimmedId = identifierInput.trim().uppercase()
        if (trimmedId.isBlank()) {
            errorMessage = when (selectedRole) {
                "farmer" -> "Farmer ID is mandatory. Please enter your Agristack ID."
                "wholesaler" -> "Wholesaler ID is mandatory. Please enter your APMC Trade Licence ID."
                else -> "Logistics Driver ID is mandatory. Please enter your Driver Permit ID."
            }
            return
        }

        if (passwordInput.isBlank()) {
            errorMessage = "Please enter your password / passcode."
            return
        }

        isVerifyingOnline = true
        errorMessage = null
        verificationStatus = "Verifying ID against Cloud Database & Clerk Auth..."

        coroutineScope.launch {
            try {
                // Mandatory verification against backend database
                val req = VerifyOnboardingRequest(
                    role = selectedRole,
                    name = nameInput.trim().ifBlank { "User" },
                    idNumber = trimmedId,
                    district = districtInput.trim().ifBlank { "Mandya" },
                    state = "Karnataka"
                )

                val res = AgriRouteApi.instance.verifyOnboarding(req)

                if (!res.ok || res.data == null) {
                    isVerifyingOnline = false
                    errorMessage = res.message ?: "Authentication failed. ID '$trimmedId' was not verified in the registry."
                    return@launch
                }

                val profile = res.data
                val session = UserSession(
                    userId = profile.clerkUserId ?: "user_${System.currentTimeMillis() % 10000}",
                    name = profile.name ?: nameInput.ifBlank { "Verified User" },
                    role = profile.role ?: selectedRole,
                    district = profile.district ?: districtInput,
                    phone = profile.phone ?: phoneInput,
                    idNumber = trimmedId,
                    token = "clerk_tok_live_${System.currentTimeMillis()}",
                    email = profile.email ?: "",
                    businessName = profile.businessName ?: "",
                    isLoggedIn = true
                )
                AgriRouteRepository.currentUserSession.value = session

                // Sync live marketplace data
                verificationStatus = "Loading marketplace data..."
                AgriRouteRepository.syncOnlineListingsAndFarmers()

                isVerifyingOnline = false
                onLoginSuccess(session.role)
            } catch (e: Exception) {
                isVerifyingOnline = false
                errorMessage = "Network or server verification error: ${e.localizedMessage ?: "Unable to connect to database"}"
            }
        }
    }

    Scaffold(
        containerColor = PaperBackground
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Logo & Branding
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(EarthGreen),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🌾", fontSize = 34.sp)
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Agri Route",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkText
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Icon(
                        Icons.Default.VerifiedUser,
                        contentDescription = null,
                        tint = EarthGreen,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Official Agristack & APMC Registry Auth",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = EarthGreenDark
                    )
                }
            }

            // Auth Mode Tabs (Sign In vs Register)
            item {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = PaperBackground,
                    contentColor = EarthGreen
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0; errorMessage = null }
                    ) {
                        Text("Sign In", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                    }
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1; errorMessage = null }
                    ) {
                        Text("Register & Verify ID", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Role Selector Chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        Triple("farmer", "Farmer (ರೈತ)", "🌾"),
                        Triple("wholesaler", "Wholesaler (ವ್ಯಾಪಾರಿ)", "🏪"),
                        Triple("logistics_driver", "Driver (ಚಾಲಕ)", "🚛")
                    ).forEach { (role, label, emoji) ->
                        val isSelected = selectedRole == role
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedRole = role; errorMessage = null },
                            label = { Text("$emoji $label", fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MintLight,
                                selectedLabelColor = EarthGreenDark
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Form Inputs
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderColor))
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = identifierInput,
                            onValueChange = { identifierInput = it; errorMessage = null },
                            label = {
                                Text(getRoleLabel())
                            },
                            placeholder = {
                                Text(
                                    when (selectedRole) {
                                        "farmer" -> "KA-MAN-2026-004417"
                                        "wholesaler" -> "WS-KA-2026-1183"
                                        else -> "DRV-KA-2026-1042"
                                    }
                                )
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Badge, contentDescription = null, tint = EarthGreen)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        if (selectedTab == 1) {
                            OutlinedTextField(
                                value = nameInput,
                                onValueChange = { nameInput = it },
                                label = { Text("Full Name / Business Name *") },
                                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = InkMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = districtInput,
                                onValueChange = { districtInput = it },
                                label = { Text("District (e.g. Mandya, Mysuru, Bengaluru)") },
                                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null, tint = InkMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = phoneInput,
                                onValueChange = { phoneInput = it },
                                label = { Text("Mobile Phone Number (Optional)") },
                                leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = InkMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                singleLine = true
                            )
                        }

                        OutlinedTextField(
                            value = passwordInput,
                            onValueChange = { passwordInput = it; errorMessage = null },
                            label = { Text("Password / Security Passcode *") },
                            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = InkMuted) },
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )

                        if (errorMessage != null) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFFFEAEA),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Error,
                                        contentDescription = null,
                                        tint = Color(0xFFE63946),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = errorMessage!!,
                                        color = Color(0xFFE63946),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        if (verificationStatus != null && isVerifyingOnline) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MintLight,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = EarthGreen,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = verificationStatus ?: "",
                                        color = EarthGreenDark,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Button(
                            onClick = { handleClerkAuth() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EarthGreen),
                            enabled = !isVerifyingOnline
                        ) {
                            if (isVerifyingOnline) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    Icons.Default.LockOpen,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (selectedTab == 0) "Verify & Sign In (Direct)" else "Register & Verify ID",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Divider & Clerk Web SSO
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = BorderColor)
                            Text(" OR ", fontSize = 11.sp, color = InkMuted, fontWeight = FontWeight.Bold)
                            HorizontalDivider(modifier = Modifier.weight(1f), color = BorderColor)
                        }

                        val context = androidx.compose.ui.platform.LocalContext.current
                        OutlinedButton(
                            onClick = {
                                val intent = android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    android.net.Uri.parse("${AgriRouteApi.BASE_URL}/sign-in")
                                )
                                context.startActivity(intent)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, EarthGreen)
                        ) {
                            Icon(
                                Icons.Default.OpenInBrowser,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = EarthGreen
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Sign In via Clerk Web Portal (SSO)",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = EarthGreen
                            )
                        }
                    }
                }
            }

            // Cloud Server Connection Footer
            item {
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MintLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.CloudQueue,
                            contentDescription = null,
                            tint = EarthGreen,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Connected to Vercel & Clerk",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = EarthGreenDark
                            )
                            Text(
                                text = AgriRouteApi.BASE_URL,
                                fontSize = 10.sp,
                                color = InkMuted
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

