package com.urbanito.app.data.repository

import com.urbanito.app.data.model.City
import com.urbanito.app.data.model.Route
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.postgrest.postgrest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UrbanitoRepository @Inject constructor(
    private val supabase: SupabaseClient
) {
    suspend fun getPopularCities(): List<City> {
        return try {
            supabase.postgrest["popular_cities"].select().decodeList<City>()
        } catch (e: Exception) {
            // Fallback mock data if DB fails or table not found
            emptyList()
        }
    }

    suspend fun getRoutesByCity(cityName: String): List<Route> {
        return try {
            supabase.postgrest["routes"]
                .select()
                .eq("city", cityName)
                .eq("is_public", true)
                .decodeList<Route>()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
