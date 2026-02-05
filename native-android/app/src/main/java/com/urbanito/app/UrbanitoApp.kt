package com.urbanito.app

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.urbanito.app.ui.screens.LibraryScreen
import com.urbanito.app.ui.screens.MapScreen

@Composable
fun UrbanitoApp() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "library") {
        composable("library") {
            LibraryScreen(
                onCityClick = { city -> 
                    navController.navigate("map/${city.id}")
                },
                onProfileClick = {
                    navController.navigate("profile")
                }
            )
        }
        composable("map/{cityId}") { backStackEntry ->
            val cityId = backStackEntry.arguments?.getString("cityId")
            MapScreen(
                cityId = cityId,
                onBack = { navController.popBackStack() }
            )
        }
        composable("profile") {
            // ProfileScreen { navController.popBackStack() }
        }
    }
}
