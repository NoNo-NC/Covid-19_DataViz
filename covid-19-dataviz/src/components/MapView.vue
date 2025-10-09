<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useCovidStore } from '@/stores/covid'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const covidStore = useCovidStore()
const mapContainer = ref(null)
let map = null
let markersLayer = null

// États pour l'animation temporelle
const currentDateIndex = ref(0)
const isPlaying = ref(false)
const playSpeed = ref(500) // ms entre chaque frame
let animationInterval = null

// Fix pour les icônes Leaflet manquantes
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Obtenir toutes les dates disponibles
const availableDates = computed(() => {
  if (!covidStore.confirmedData || !covidStore.confirmedData.headers) return []

  return covidStore.confirmedData.headers
    .slice(4) // Ignorer les 4 premières colonnes
    .filter((date) => date.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/))
})

// Date sélectionnée
const selectedDate = computed(() => {
  if (!availableDates.value.length) return null
  return availableDates.value[currentDateIndex.value]
})

// Données géographiques pour la date sélectionnée
const mapData = computed(() => {
  if (!covidStore.confirmedData || !selectedDate.value) return []

  return covidStore.confirmedData.data
    .map((row) => {
      const lat = parseFloat(row.Lat)
      const lng = parseFloat(row.Long)
      const value = parseInt(row[selectedDate.value]) || 0

      if (!isNaN(lat) && !isNaN(lng) && value > 0) {
        return {
          country: row['Country/Region'],
          state: row['Province/State'] || '',
          lat,
          lng,
          value,
          location: row['Province/State']
            ? `${row['Province/State']}, ${row['Country/Region']}`
            : row['Country/Region'],
        }
      }
      return null
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.value - a.value)
})

// Statistiques pour la date sélectionnée
const dateStats = computed(() => {
  if (!mapData.value.length) return null

  const totalCases = mapData.value.reduce((sum, item) => sum + item.value, 0)
  const maxCases = Math.max(...mapData.value.map((item) => item.value))
  const affectedRegions = mapData.value.length

  return {
    totalCases,
    maxCases,
    affectedRegions,
    date: selectedDate.value,
  }
})

// Fonction pour déterminer la couleur et la taille du marqueur (améliorée pour l'animation)
function getMarkerStyle(value, maxValue = null) {
  // Normalisation basée sur la valeur max globale pour cohérence dans l'animation
  const normalizedValue = maxValue ? value / maxValue : value

  let color, size, opacity

  if (value > 1000000) {
    color = '#dc3545' // Rouge foncé
    size = 20
    opacity = 0.9
  } else if (value > 100000) {
    color = '#fd7e14' // Orange
    size = 16
    opacity = 0.8
  } else if (value > 10000) {
    color = '#ffc107' // Jaune
    size = 12
    opacity = 0.7
  } else if (value > 1000) {
    color = '#20c997' // Turquoise
    size = 9
    opacity = 0.6
  } else if (value > 100) {
    color = '#6f42c1' // Violet
    size = 6
    opacity = 0.5
  } else {
    color = '#17a2b8' // Bleu clair
    size = 4
    opacity = 0.4
  }

  // Ajustement de la taille basé sur la valeur normalisée pour une animation fluide
  const dynamicSize = Math.max(size * (0.3 + 0.7 * normalizedValue), 3)

  return { color, size: dynamicSize, opacity }
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
    zoomControl: true,
    preferCanvas: true, // Améliore les performances pour l'animation
    // Limiter les mouvements de la carte
    maxBounds: [
      [-90, -180], // Sud-Ouest (coin inférieur gauche)
      [90, 180], // Nord-Est (coin supérieur droit)
    ],
    maxBoundsViscosity: 1.0, // Empêche de sortir des limites
    worldCopyJump: false, // Désactive le saut vers les copies du monde
    noWrap: true, // Empêche l'enroulement horizontal
  })

  // Ajouter les tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 2,
  }).addTo(map)

  // Créer layer group pour les marqueurs
  markersLayer = L.layerGroup().addTo(map)

  // Initialiser à la dernière date disponible
  if (availableDates.value.length > 0) {
    currentDateIndex.value = availableDates.value.length - 1
    updateMarkers()
  }
}

// Mettre à jour les marqueurs sur la carte (optimisé pour l'animation)
function updateMarkers() {
  if (!map || !markersLayer || !mapData.value.length) return

  markersLayer.clearLayers()

  // Calculer la valeur max pour normalisation
  const maxValue = Math.max(...mapData.value.map((item) => item.value))

  mapData.value.forEach((item) => {
    const { color, size, opacity } = getMarkerStyle(item.value, maxValue)

    // Créer marqueur circulaire avec animation
    const circle = L.circleMarker([item.lat, item.lng], {
      radius: size,
      fillColor: color,
      color: '#ffffff',
      weight: 1,
      opacity: opacity,
      fillOpacity: opacity * 0.8,
    })

    // Popup avec informations détaillées
    const popupContent = `
      <div class="map-popup">
        <h6 class="fw-bold mb-2 text-primary">${item.location}</h6>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-muted">Cas confirmés:</span>
          <span class="fw-bold text-danger">${new Intl.NumberFormat('fr-FR').format(item.value)}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted">Date:</span>
          <span class="fw-bold">${formatDateForDisplay(selectedDate.value)}</span>
        </div>
        <small class="text-muted mt-1 d-block">Cliquez pour ajouter aux graphiques</small>
      </div>
    `

    circle.bindPopup(popupContent, {
      maxWidth: 280,
      className: 'custom-popup',
    })

    // Tooltip au survol
    circle.bindTooltip(
      `${item.location}: ${new Intl.NumberFormat('fr-FR').format(item.value)} cas`,
      {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip',
      },
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

// Formater la date pour l'affichage
function formatDateForDisplay(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Adapter la vue aux données
function fitMapToData() {
  if (!map || !mapData.value.length) return

  const bounds = L.latLngBounds(mapData.value.map((item) => [item.lat, item.lng]))
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 4 })
}

// Contrôles de l'animation
function playAnimation() {
  if (isPlaying.value || !availableDates.value.length) return

  isPlaying.value = true
  animationInterval = setInterval(() => {
    if (currentDateIndex.value >= availableDates.value.length - 1) {
      // Fin de l'animation, recommencer ou arrêter
      currentDateIndex.value = 0
    } else {
      currentDateIndex.value++
    }
  }, playSpeed.value)
}

function pauseAnimation() {
  isPlaying.value = false
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

function toggleAnimation() {
  if (isPlaying.value) {
    pauseAnimation()
  } else {
    playAnimation()
  }
}

function resetAnimation() {
  pauseAnimation()
  currentDateIndex.value = 0
}

function goToLastDate() {
  pauseAnimation()
  if (availableDates.value.length > 0) {
    currentDateIndex.value = availableDates.value.length - 1
  }
}

// Changer la vitesse d'animation
function changeSpeed(newSpeed) {
  playSpeed.value = newSpeed
  if (isPlaying.value) {
    pauseAnimation()
    playAnimation()
  }
}

// Watchers
watch(currentDateIndex, () => {
  nextTick(() => {
    updateMarkers()
  })
})

watch(
  () => covidStore.confirmedData,
  (newData) => {
    if (newData && map) {
      nextTick(() => {
        if (availableDates.value.length > 0) {
          currentDateIndex.value = availableDates.value.length - 1
          updateMarkers()
          setTimeout(fitMapToData, 100)
        }
      })
    }
  },
)

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  pauseAnimation()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-view">
    <div class="card shadow-sm h-100">
      <!-- Header avec contrôles -->
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="card-title mb-0">🗺️ Carte mondiale interactive</h5>
          <div class="d-flex align-items-center gap-2">
            <button
              v-if="map"
              @click="fitMapToData"
              class="btn btn-outline-primary btn-sm"
              title="Centrer sur les données"
            >
              📍 Recentrer
            </button>
            <small class="text-muted"> {{ mapData.length }} régions </small>
          </div>
        </div>

        <!-- Informations de la date sélectionnée -->
        <div v-if="dateStats" class="row g-2 mb-3 text-center">
          <div class="col-4">
            <div class="bg-light rounded p-2">
              <div class="fw-bold text-primary">
                {{ new Intl.NumberFormat('fr-FR').format(dateStats.totalCases) }}
              </div>
              <small class="text-muted">Total cas</small>
            </div>
          </div>
          <div class="col-4">
            <div class="bg-light rounded p-2">
              <div class="fw-bold text-danger">
                {{ new Intl.NumberFormat('fr-FR').format(dateStats.maxCases) }}
              </div>
              <small class="text-muted">Max pays</small>
            </div>
          </div>
          <div class="col-4">
            <div class="bg-light rounded p-2">
              <div class="fw-bold text-success">{{ dateStats.affectedRegions }}</div>
              <small class="text-muted">Régions</small>
            </div>
          </div>
        </div>

        <!-- Contrôles temporels -->
        <div class="time-controls">
          <!-- Date actuelle -->
          <div class="text-center mb-2">
            <h6 class="mb-1">📅 {{ formatDateForDisplay(selectedDate) }}</h6>
            <small class="text-muted">
              Jour {{ currentDateIndex + 1 }} / {{ availableDates.length }}
            </small>
          </div>

          <!-- Slider temporel -->
          <div class="mb-3">
            <input
              v-model.number="currentDateIndex"
              type="range"
              class="form-range"
              :min="0"
              :max="availableDates.length - 1"
              :step="1"
              @input="pauseAnimation"
            />
          </div>

          <!-- Boutons de contrôle -->
          <div class="d-flex justify-content-center align-items-center gap-2">
            <button @click="resetAnimation" class="btn btn-outline-secondary btn-sm" title="Début">
              ⏮️
            </button>

            <button
              @click="currentDateIndex = Math.max(0, currentDateIndex - 1)"
              class="btn btn-outline-secondary btn-sm"
              :disabled="currentDateIndex === 0"
              title="Précédent"
            >
              ⏪
            </button>

            <button
              @click="toggleAnimation"
              class="btn btn-sm"
              :class="isPlaying ? 'btn-danger' : 'btn-success'"
              title="Play/Pause"
            >
              {{ isPlaying ? '⏸️ Pause' : '▶️ Play' }}
            </button>

            <button
              @click="currentDateIndex = Math.min(availableDates.length - 1, currentDateIndex + 1)"
              class="btn btn-outline-secondary btn-sm"
              :disabled="currentDateIndex === availableDates.length - 1"
              title="Suivant"
            >
              ⏩
            </button>

            <button @click="goToLastDate" class="btn btn-outline-secondary btn-sm" title="Fin">
              ⏭️
            </button>
          </div>

          <!-- Contrôle de vitesse -->
          <div class="d-flex justify-content-center align-items-center gap-2 mt-2">
            <small class="text-muted">Vitesse:</small>
            <button
              v-for="speed in [1000, 500, 250, 100]"
              :key="speed"
              @click="changeSpeed(speed)"
              class="btn btn-sm"
              :class="playSpeed === speed ? 'btn-primary' : 'btn-outline-primary'"
              style="min-width: 40px"
            >
              {{ speed === 1000 ? '1x' : speed === 500 ? '2x' : speed === 250 ? '4x' : '10x' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-0 position-relative">
        <!-- Loading overlay -->
        <div
          v-if="covidStore.loading"
          class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75"
          style="z-index: 1000"
        >
          <div class="text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <p class="text-muted mb-0">Chargement de la carte...</p>
          </div>
        </div>

        <!-- Map container -->
        <div ref="mapContainer" class="map-container" style="height: 400px; width: 100%"></div>

        <!-- Legend -->
        <div
          class="map-legend position-absolute bottom-0 start-0 m-2 bg-white p-2 rounded shadow-sm"
        >
          <small class="fw-bold d-block mb-1">Légende (cas):</small>
          <div class="d-flex flex-column gap-1" style="font-size: 0.75rem">
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #dc3545; width: 16px; height: 16px; border-radius: 50%"
              ></div>
              <span>&gt; 1M</span>
            </div>
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #fd7e14; width: 12px; height: 12px; border-radius: 50%"
              ></div>
              <span>&gt; 100K</span>
            </div>
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #ffc107; width: 10px; height: 10px; border-radius: 50%"
              ></div>
              <span>&gt; 10K</span>
            </div>
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #20c997; width: 8px; height: 8px; border-radius: 50%"
              ></div>
              <span>&gt; 1K</span>
            </div>
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #6f42c1; width: 6px; height: 6px; border-radius: 50%"
              ></div>
              <span>&gt; 100</span>
            </div>
            <div class="d-flex align-items-center">
              <div
                class="legend-circle me-2"
                style="background: #17a2b8; width: 4px; height: 4px; border-radius: 50%"
              ></div>
              <span>&lt; 100</span>
            </div>
          </div>
        </div>

        <!-- Indicateur d'animation -->
        <div
          v-if="isPlaying"
          class="position-absolute top-0 end-0 m-2 bg-success text-white px-2 py-1 rounded-pill"
          style="z-index: 1000; font-size: 0.75rem"
        >
          ▶️ Animation en cours
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  border-radius: 0 0 0.375rem 0.375rem;
}

.map-legend {
  font-size: 0.85rem;
  max-width: 140px;
  z-index: 1000;
}

.legend-circle {
  display: inline-block;
}

.time-controls {
  background: #f8f9fa;
  border-radius: 0.375rem;
  padding: 1rem;
}

.form-range {
  height: 6px;
}

.form-range::-webkit-slider-thumb {
  background: #0d6efd;
  border: none;
  width: 20px;
  height: 20px;
}

.form-range::-moz-range-thumb {
  background: #0d6efd;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

/* Styles pour les popups et tooltips Leaflet */
:global(.custom-popup .leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:global(.custom-tooltip) {
  background-color: rgba(0, 0, 0, 0.8) !important;
  border: none !important;
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
}

:global(.map-popup) {
  min-width: 200px;
}

@media (max-width: 768px) {
  .map-legend {
    font-size: 0.75rem;
    max-width: 120px;
  }

  .map-container {
    height: 350px !important;
  }

  .time-controls {
    padding: 0.75rem;
  }

  .btn-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
