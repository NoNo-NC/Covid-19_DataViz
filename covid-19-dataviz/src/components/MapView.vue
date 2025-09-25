<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useCovidStore } from '@/stores/covid'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const covidStore = useCovidStore()
const mapContainer = ref(null)
let map = null
let markersLayer = null

// Fix pour les icônes Leaflet manquantes
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Données géographiques calculées
const mapData = computed(() => {
  if (!covidStore.confirmedData) return []
  
  return covidStore.confirmedData.data
    .map(row => {
      const lat = parseFloat(row.Lat)
      const lng = parseFloat(row.Long)
      
      // Obtenir la dernière valeur (dernière colonne de date)
      const dateColumns = Object.keys(row).filter(key => 
        key.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)
      )
      const lastDate = dateColumns[dateColumns.length - 1]
      const value = parseInt(row[lastDate]) || 0
      
      if (!isNaN(lat) && !isNaN(lng) && value > 0) {
        return {
          country: row['Country/Region'],
          state: row['Province/State'] || '',
          lat,
          lng,
          value,
          location: row['Province/State'] 
            ? `${row['Province/State']}, ${row['Country/Region']}` 
            : row['Country/Region']
        }
      }
      return null
    })
    .filter(item => item !== null)
    .sort((a, b) => b.value - a.value)
})

// Fonction pour déterminer la couleur et la taille du marqueur
function getMarkerStyle(value) {
  let color, size
  
  if (value > 1000000) {
    color = '#dc3545' // Rouge foncé
    size = 18
  } else if (value > 100000) {
    color = '#fd7e14' // Orange
    size = 14
  } else if (value > 10000) {
    color = '#ffc107' // Jaune
    size = 11
  } else if (value > 1000) {
    color = '#20c997' // Turquoise
    size = 8
  } else {
    color = '#6f42c1' // Violet
    size = 6
  }
  
  return { color, size }
}

// Initialiser la carte
function initMap() {
  if (!mapContainer.value) return
  
  map = L.map(mapContainer.value, {
    center: [20, 0],
    zoom: 2,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    zoomControl: true
  })

  // Ajouter les tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 2
  }).addTo(map)

  // Créer layer group pour les marqueurs
  markersLayer = L.layerGroup().addTo(map)
  
  // Ajouter les marqueurs si données disponibles
  updateMarkers()
}

// Mettre à jour les marqueurs sur la carte
function updateMarkers() {
  if (!map || !markersLayer || !mapData.value.length) return
  
  markersLayer.clearLayers()
  
  mapData.value.forEach(item => {
    const { color, size } = getMarkerStyle(item.value)
    
    // Créer marqueur circulaire
    const circle = L.circleMarker([item.lat, item.lng], {
      radius: size,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.8
    })
    
    // Popup avec informations détaillées
    const popupContent = `
      <div class="map-popup">
        <h6 class="fw-bold mb-2 text-primary">${item.location}</h6>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted">Cas confirmés:</span>
          <span class="fw-bold text-danger">${new Intl.NumberFormat('fr-FR').format(item.value)}</span>
        </div>
        <small class="text-muted mt-1 d-block">Cliquez pour plus d'infos</small>
      </div>
    `
    
    circle.bindPopup(popupContent, {
      maxWidth: 250,
      className: 'custom-popup'
    })
    
    // Tooltip au survol
    circle.bindTooltip(
      `${item.location}: ${new Intl.NumberFormat('fr-FR').format(item.value)} cas`,
      { 
        permanent: false, 
        direction: 'top',
        className: 'custom-tooltip'
      }
    )
    
    // Événement click pour sélectionner le pays
    circle.on('click', () => {
      if (item.country && !covidStore.selectedCountries.includes(item.country)) {
        covidStore.addSelectedCountry(item.country)
      }
    })
    
    markersLayer.addLayer(circle)
  })
}

// Adapter la vue aux données
function fitMapToData() {
  if (!map || !mapData.value.length) return
  
  const bounds = L.latLngBounds(mapData.value.map(item => [item.lat, item.lng]))
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 4 })
}

// Watchers
watch(mapData, () => {
  nextTick(() => {
    updateMarkers()
  })
}, { deep: true })

watch(() => covidStore.confirmedData, (newData) => {
  if (newData && map) {
    nextTick(() => {
      updateMarkers()
      setTimeout(fitMapToData, 100)
    })
  }
})

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initMap()
    if (covidStore.confirmedData) {
      updateMarkers()
      setTimeout(fitMapToData, 500)
    }
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-view">
    <div class="card shadow-sm h-100">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">🗺️ Carte mondiale</h5>
        <div class="d-flex align-items-center">
          <button 
            v-if="map"
            @click="fitMapToData" 
            class="btn btn-outline-primary btn-sm me-2"
            title="Centrer sur les données"
          >
            📍 Recentrer
          </button>
          <small class="text-muted">
            {{ mapData.length }} régions
          </small>
        </div>
      </div>
      
      <div class="card-body p-0 position-relative">
        <!-- Loading overlay -->
        <div 
          v-if="covidStore.loading" 
          class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75"
          style="z-index: 1000;"
        >
          <div class="text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <p class="text-muted mb-0">Chargement de la carte...</p>
          </div>
        </div>
        
        <!-- Map container -->
        <div 
          ref="mapContainer" 
          class="map-container"
          style="height: 500px; width: 100%;"
        ></div>
        
        <!-- Legend -->
        <div class="map-legend position-absolute bottom-0 start-0 m-2 bg-white p-2 rounded shadow-sm">
          <small class="fw-bold d-block mb-1">Légende (cas):</small>
          <div class="d-flex flex-column gap-1" style="font-size: 0.75rem;">
            <div class="d-flex align-items-center">
              <div class="legend-circle me-2" style="background: #dc3545; width: 16px; height: 16px;"></div>
              <span>> 1M</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-circle me-2" style="background: #fd7e14; width: 12px; height: 12px;"></div>
              <span>> 100K</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-circle me-2" style="background: #ffc107; width: 10px; height: 10px;"></div>
              <span>> 10K</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-circle me-2" style="background: #20c997; width: 8px; height: 8px;"></div>
              <span>> 1K</span>
            </div>
            <div class="d-flex align-items-center">
              <div class="legend-circle me-2" style="background: #6f42c1; width: 6px; height: 6px;"></div>
              <span>< 1K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>