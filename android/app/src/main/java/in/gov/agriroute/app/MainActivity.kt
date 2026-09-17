package in.gov.agriroute.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import in.gov.agriroute.app.data.models.UserSession
import in.gov.agriroute.app.data.repository.AgriRouteRepository
import in.gov.agriroute.app.ui.screens.*
import in.gov.agriroute.app.ui.theme.AgriRouteTheme

class MainActivity : ComponentActivity() {
    private var navController: NavController? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        handleDeepLinkIntent(intent)

        setContent {
            AgriRouteTheme {
                val nc = rememberNavController()
                navController = nc

                val sessionState = AgriRouteRepository.currentUserSession.collectAsState()
                val currentRole = sessionState.value?.role

                val startDest = if (sessionState.value?.isLoggedIn == true) {
                    when (currentRole) {
                        "farmer" -> "farmer_dashboard"
                        "wholesaler" -> "wholesaler_marketplace"
                        "driver", "logistics_driver" -> "driver_dashboard"
                        else -> "role_selection"
                    }
                } else {
                    "login"
                }

                NavHost(navController = nc, startDestination = startDest) {
                    composable("login") {
                        LoginScreen(
                            onLoginSuccess = { role ->
                                when (role) {
                                    "farmer" -> nc.navigate("farmer_dashboard")
                                    "wholesaler" -> nc.navigate("wholesaler_marketplace")
                                    "driver", "logistics_driver" -> nc.navigate("driver_dashboard")
                                    else -> nc.navigate("role_selection")
                                }
                            }
                        )
                    }

                    composable("role_selection") {
                        RoleSelectionScreen(
                            onSelectFarmer = { nc.navigate("farmer_dashboard") },
                            onSelectWholesaler = { nc.navigate("wholesaler_marketplace") },
                            onSelectDriver = { nc.navigate("driver_dashboard") },
                            onLogout = { 
                                AgriRouteRepository.currentUserSession.value = null
                                nc.navigate("login") 
                            }
                        )
                    }

                    composable("farmer_dashboard") {
                        FarmerDashboardScreen(
                            onNavigateToListProduce = { nc.navigate("create_listing") },
                            onNavigateToPools = { nc.navigate("pooled_lots") },
                            onNavigateToSchemes = { nc.navigate("schemes_storage") },
                            onNavigateToOrders = { nc.navigate("farmer_orders") },
                            onNavigateToEarnings = { nc.navigate("farmer_earnings") },
                            onNavigateToNegotiations = { nc.navigate("farmer_negotiations") },
                            onSwitchRole = { nc.navigate("role_selection") }
                        )
                    }

                    composable("create_listing") {
                        CreateListingScreen(
                            onNavigateBack = { nc.popBackStack() },
                            onSubmitSuccess = { nc.navigate("pooled_lots") }
                        )
                    }

                    composable("pooled_lots") {
                        PooledLotsScreen(onNavigateBack = { nc.popBackStack() })
                    }

                    composable("farmer_orders") {
                        FarmerOrdersScreen(
                            onNavigateBack = { nc.popBackStack() },
                            onNavigateToEarnings = { nc.navigate("farmer_earnings") }
                        )
                    }

                    composable("farmer_earnings") {
                        FarmerEarningsScreen(
                            onNavigateBack = { nc.popBackStack() }
                        )
                    }

                    composable("farmer_negotiations") {
                        FarmerNegotiationsScreen(
                            onNavigateBack = { nc.popBackStack() },
                            onNavigateToOrders = { nc.navigate("farmer_orders") }
                        )
                    }

                    composable("wholesaler_marketplace") {
                        WholesalerMarketplaceScreen(
                            onNavigateToCart = { nc.navigate("wholesaler_cart") },
                            onNavigateToOrders = { nc.navigate("wholesaler_orders") },
                            onSwitchRole = { nc.navigate("role_selection") }
                        )
                    }

                    composable("wholesaler_cart") {
                        WholesalerCartScreen(
                            onNavigateBack = { nc.popBackStack() },
                            onOrderPlaced = { nc.navigate("wholesaler_orders") }
                        )
                    }

                    composable("wholesaler_orders") {
                        WholesalerOrdersScreen(
                            onNavigateBack = { nc.popBackStack() }
                        )
                    }

                    composable("driver_dashboard") {
                        DriverDashboardScreen(
                            onSwitchRole = { nc.navigate("role_selection") }
                        )
                    }

                    composable("schemes_storage") {
                        SchemesAndStorageScreen(onNavigateBack = { nc.popBackStack() })
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepLinkIntent(intent)
    }

    private fun handleDeepLinkIntent(intent: Intent?) {
        val data: Uri? = intent?.data ?: return
        val scheme = data.scheme ?: ""
        val host = data.host ?: ""

        if (scheme == "agriroute" || host == "agri-route-red.vercel.app") {
            val roleParam = data.getQueryParameter("role") ?: "farmer"
            val nameParam = data.getQueryParameter("name") ?: "Verified User"
            val districtParam = data.getQueryParameter("district") ?: "Mandya"
            val idParam = data.getQueryParameter("idNumber") ?: ""
            val userIdParam = data.getQueryParameter("userId") ?: "user_clerk_${System.currentTimeMillis()}"

            val normalizedRole = when (roleParam.lowercase()) {
                "farmer" -> "farmer"
                "wholesaler" -> "wholesaler"
                "driver", "logistics_driver" -> "driver"
                else -> "farmer"
            }

            AgriRouteRepository.currentUserSession.value = UserSession(
                userId = userIdParam,
                name = nameParam,
                role = normalizedRole,
                district = districtParam,
                phone = "",
                idNumber = idParam,
                token = "clerk_verified_token_${System.currentTimeMillis()}",
                email = "",
                businessName = if (normalizedRole == "wholesaler") nameParam else "",
                isLoggedIn = true
            )

            // Navigate destination if navController is initialized
            val destination = when (normalizedRole) {
                "farmer" -> "farmer_dashboard"
                "wholesaler" -> "wholesaler_marketplace"
                "driver" -> "driver_dashboard"
                else -> "role_selection"
            }

            navController?.navigate(destination) {
                popUpTo("login") { inclusive = true }
            }
        }
    }
}
