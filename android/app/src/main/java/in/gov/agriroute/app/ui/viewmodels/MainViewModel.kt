package `in`.gov.agriroute.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import `in`.gov.agriroute.app.data.models.*
import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class UiState(
    val isRefreshing: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val mandiPrice: MandiPriceData? = null,
    val schemes: List<SchemeMatchDto> = emptyList(),
    val storageFacilities: List<ColdStorageFacility> = emptyList(),
    val storageAdvice: StorageAdviceDto? = null
)

class MainViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    init {
        refreshAll()
    }

    fun refreshAll() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, errorMessage = null)
            try {
                // Sync marketplace listings and collective truckload pools
                AgriRouteRepository.syncOnlineListingsAndFarmers()
                
                // Sync orders & negotiations
                AgriRouteRepository.fetchOrdersOnline()
                AgriRouteRepository.fetchNegotiationsOnline()
                AgriRouteRepository.fetchLogisticsJobsOnline()

                // Fetch Mandi benchmarks
                val prices = AgriRouteRepository.fetchPricesOnline("tomato", "Mandya")
                val schemes = AgriRouteRepository.fetchSchemesOnline("tomato", 2.0)
                val storages = AgriRouteRepository.fetchColdStorageFacilitiesOnline("Mandya", "tomato")
                val advice = AgriRouteRepository.fetchStorageAdviceOnline("tomato", 600.0, 14.0)

                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    mandiPrice = prices,
                    schemes = schemes,
                    storageFacilities = storages,
                    storageAdvice = advice
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    errorMessage = e.message
                )
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }
}
