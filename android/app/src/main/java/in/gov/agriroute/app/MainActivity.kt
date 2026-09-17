package `in`.gov.agriroute.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import `in`.gov.agriroute.app.ui.screens.*
import `in`.gov.agriroute.app.ui.theme.AgriRouteTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AgriRouteTheme {
                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = "login") {
                    composable("login") {
                        LoginScreen(
                            onLoginSuccess = { role ->
                                when (role) {
                                    "farmer" -> navController.navigate("farmer_dashboard")
                                    "wholesaler" -> navController.navigate("wholesaler_marketplace")
                                    "driver" -> navController.navigate("driver_dashboard")
                                    else -> navController.navigate("role_selection")
                                }
                            }
                        )
                    }

                    composable("role_selection") {
                        RoleSelectionScreen(
                            onSelectFarmer = { navController.navigate("farmer_dashboard") },
                            onSelectWholesaler = { navController.navigate("wholesaler_marketplace") },
                            onSelectDriver = { navController.navigate("driver_dashboard") },
                            onLogout = { navController.navigate("login") }
                        )
                    }

                    composable("farmer_dashboard") {
                        FarmerDashboardScreen(
                            onNavigateToListProduce = { navController.navigate("create_listing") },
                            onNavigateToPools = { navController.navigate("pooled_lots") },
                            onNavigateToSchemes = { navController.navigate("schemes_storage") },
                            onNavigateToOrders = { navController.navigate("farmer_orders") },
                            onNavigateToEarnings = { navController.navigate("farmer_earnings") },
                            onNavigateToNegotiations = { navController.navigate("farmer_negotiations") },
                            onSwitchRole = { navController.navigate("role_selection") }
                        )
                    }

                    composable("create_listing") {
                        CreateListingScreen(
                            onNavigateBack = { navController.popBackStack() },
                            onSubmitSuccess = { navController.navigate("pooled_lots") }
                        )
                    }

                    composable("pooled_lots") {
                        PooledLotsScreen(onNavigateBack = { navController.popBackStack() })
                    }

                    composable("farmer_orders") {
                        FarmerOrdersScreen(
                            onNavigateBack = { navController.popBackStack() },
                            onNavigateToEarnings = { navController.navigate("farmer_earnings") }
                        )
                    }

                    composable("farmer_earnings") {
                        FarmerEarningsScreen(
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }

                    composable("farmer_negotiations") {
                        FarmerNegotiationsScreen(
                            onNavigateBack = { navController.popBackStack() },
                            onNavigateToOrders = { navController.navigate("farmer_orders") }
                        )
                    }

                    composable("wholesaler_marketplace") {
                        WholesalerMarketplaceScreen(
                            onNavigateToCart = { navController.navigate("wholesaler_cart") },
                            onNavigateToOrders = { navController.navigate("wholesaler_orders") },
                            onSwitchRole = { navController.navigate("role_selection") }
                        )
                    }

                    composable("wholesaler_cart") {
                        WholesalerCartScreen(
                            onNavigateBack = { navController.popBackStack() },
                            onOrderPlaced = { navController.navigate("wholesaler_orders") }
                        )
                    }

                    composable("wholesaler_orders") {
                        WholesalerOrdersScreen(
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }

                    composable("driver_dashboard") {
                        DriverDashboardScreen(
                            onSwitchRole = { navController.navigate("role_selection") }
                        )
                    }

                    composable("schemes_storage") {
                        SchemesAndStorageScreen(onNavigateBack = { navController.popBackStack() })
                    }
                }
            }
        }
    }
}
