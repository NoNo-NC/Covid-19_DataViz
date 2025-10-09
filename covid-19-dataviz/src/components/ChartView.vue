<script setup>
import { ref, computed } from 'vue'
import { useCovidStore } from '@/stores/covid'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

const covidStore = useCovidStore()
const chartRef = ref(null)
const isLogarithmic = ref(false)
const viewMode = ref('cumulative') // 'cumulative' ou 'daily'
const showMovingAverage7 = ref(false) // Désactivé par défaut
const showMovingAverage14 = ref(false) // Désactivé par défaut

// Couleurs pour les différents pays
const colors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
]

// Computed pour déterminer si la tendance doit être affichée
const shouldShowTrendLine = computed(() => {
  if (viewMode.value === 'cumulative') {
    return true // Toujours afficher en mode cumulatif
  }
  // En mode journalier : afficher seulement si aucune moyenne mobile n'est activée
  return !showMovingAverage7.value && !showMovingAverage14.value
})

// Fonction pour générer des couleurs de moyennes mobiles basées sur les couleurs principales
function getMovingAverageColor(baseColor, type) {
  // Convertir la couleur hex en RGB pour manipulation
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  const rgb = hexToRgb(baseColor)
  if (!rgb) return baseColor

  if (type === 7) {
    // Moyenne 7j : version plus saturée et légèrement décalée vers le rouge
    return `rgb(${Math.min(255, rgb.r + 30)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`
  } else if (type === 14) {
    // Moyenne 14j : version plus douce et décalée vers le vert/bleu
    return `rgb(${Math.max(0, rgb.r - 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 30)})`
  }

  return baseColor
}

// Styles de lignes différents
const lineStyles = {
  raw: { dash: [], width: 1.5, opacity: '40' },
  avg7: { dash: [8, 4], width: 3, opacity: '' },
  avg14: { dash: [12, 8, 4, 8], width: 3, opacity: '' },
  trend: { dash: [15, 10], width: 2, opacity: '' },
}

// Fonction pour calculer la moyenne mobile
function calculateMovingAverage(data, windowSize = 7) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null) // Pas assez de données au début
    } else {
      const slice = data.slice(i - windowSize + 1, i + 1)
      const validValues = slice.filter((val) => val !== null && val !== undefined)
      if (validValues.length === 0) {
        result.push(null)
      } else {
        const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length
        result.push(Math.round(avg))
      }
    }
  }
  return result
}

// Fonction pour calculer les nouveaux cas journaliers - VERSION SIMPLE
function calculateDailyCases(cumulativeData) {
  const dailyCases = [0] // Premier jour = 0 nouveaux cas
  for (let i = 1; i < cumulativeData.length; i++) {
    const current = cumulativeData[i] || 0
    const previous = cumulativeData[i - 1] || 0
    const newCases = current - previous
    // Mettre à 0 si négatif (corrections de données)
    dailyCases.push(Math.max(0, newCases))
  }
  return dailyCases
}

// Fonction pour calculer la ligne de tendance (régression linéaire simple)
function calculateTrendLine(data) {
  const validPoints = []
  data.forEach((value, index) => {
    if (value !== null && value !== undefined && !isNaN(value)) {
      validPoints.push({ x: index, y: value })
    }
  })

  if (validPoints.length < 2) return new Array(data.length).fill(null)

  // Calcul de la régression linéaire
  const n = validPoints.length
  const sumX = validPoints.reduce((sum, point) => sum + point.x, 0)
  const sumY = validPoints.reduce((sum, point) => sum + point.y, 0)
  const sumXY = validPoints.reduce((sum, point) => sum + point.x * point.y, 0)
  const sumXX = validPoints.reduce((sum, point) => sum + point.x * point.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Générer la ligne de tendance en s'assurant qu'elle reste positive
  return data.map((_, index) => {
    if (isNaN(slope) || isNaN(intercept)) return null

    const trendValue = slope * index + intercept

    // Ne retourner la tendance que si elle est positive et qu'on a des données à cet index
    if (trendValue > 0 && data[index] !== null && data[index] !== undefined) {
      return Math.round(trendValue)
    }

    return null
  })
}

// Fonction pour obtenir les statistiques d'analyse
const dataAnalysis = computed(() => {
  if (!covidStore.selectedCountries.length || !covidStore.confirmedData) return null

  const headers = covidStore.confirmedData.headers.slice(4)
  const analysis = {}

  covidStore.selectedCountries.forEach((country) => {
    const countryData = covidStore.confirmedData.data.filter(
      (row) => row['Country/Region'] === country,
    )

    const cumulativeValues = headers.map((date) => {
      return countryData.reduce((sum, row) => {
        return sum + (parseInt(row[date]) || 0)
      }, 0)
    })

    const dailyValues = calculateDailyCases(cumulativeValues)
    const movingAvg7 = calculateMovingAverage(dailyValues, 7)

    // Calcul des statistiques
    const currentTotal = cumulativeValues[cumulativeValues.length - 1] || 0
    const lastWeekDaily = dailyValues.slice(-7).filter((v) => v > 0)
    const avgDaily7 =
      lastWeekDaily.length > 0
        ? Math.round(lastWeekDaily.reduce((a, b) => a + b, 0) / lastWeekDaily.length)
        : 0

    // Tendance (basée sur les 7 derniers jours)
    const lastWeekAvg = movingAvg7.slice(-7).filter((v) => v !== null)
    const trend =
      lastWeekAvg.length >= 2
        ? (lastWeekAvg[lastWeekAvg.length - 1] - lastWeekAvg[0]) / lastWeekAvg.length
        : 0

    analysis[country] = {
      currentTotal,
      avgDaily7,
      trend: Math.round(trend),
      trendDirection: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
    }
  })

  return analysis
})

const chartData = computed(() => {
  if (!covidStore.confirmedData || !covidStore.selectedCountries.length) {
    return null
  }

  const headers = covidStore.confirmedData.headers.slice(4)
  const labels = headers.map((date) => {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
  })

  const datasets = []

  covidStore.selectedCountries.forEach((country, index) => {
    const countryData = covidStore.confirmedData.data.filter(
      (row) => row['Country/Region'] === country,
    )

    // Données cumulatives
    const cumulativeValues = headers.map((date) => {
      return countryData.reduce((sum, row) => {
        return sum + (parseInt(row[date]) || 0)
      }, 0)
    })

    const baseColor = colors[index % colors.length]

    if (viewMode.value === 'cumulative') {
      // Mode cumulatif
      datasets.push({
        label: `📈 ${country}`,
        data: cumulativeValues,
        borderColor: baseColor,
        backgroundColor: baseColor + '20',
        tension: 0.1,
        pointRadius: 1,
        pointHoverRadius: 4,
        borderWidth: 2,
      })

      // Ligne de tendance pour les données cumulatives (toujours affichée)
      if (shouldShowTrendLine.value) {
        const trendData = calculateTrendLine(cumulativeValues)
        datasets.push({
          label: `📊 ${country} (tendance)`,
          data: trendData,
          borderColor: baseColor,
          backgroundColor: 'transparent',
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: lineStyles.trend.width,
          borderDash: lineStyles.trend.dash,
          opacity: 0.7,
        })
      }
    } else {
      // Mode journalier
      const dailyValues = calculateDailyCases(cumulativeValues)

      // Déterminer si les moyennes mobiles sont activées
      const hasMovingAverages = showMovingAverage7.value || showMovingAverage14.value

      // Courbe des cas journaliers (brute) - Plus ou moins visible selon les options
      datasets.push({
        label: hasMovingAverages ? `⚪ ${country} (brut)` : `📊 ${country} (quotidien)`,
        data: dailyValues,
        borderColor: hasMovingAverages ? baseColor + '25' : baseColor + '70',
        backgroundColor: hasMovingAverages ? baseColor + '08' : baseColor + '15',
        tension: 0.1,
        pointRadius: hasMovingAverages ? 0 : 0.5,
        pointHoverRadius: hasMovingAverages ? 2 : 3,
        borderWidth: hasMovingAverages ? 1 : 1.5,
        borderDash: hasMovingAverages ? [2, 3] : [],
        order: hasMovingAverages ? 3 : 1,
      })

      // Moyenne mobile 7 jours - Couleur dérivée du pays
      if (showMovingAverage7.value) {
        const movingAvg7 = calculateMovingAverage(dailyValues, 7)
        const avg7Color = getMovingAverageColor(baseColor, 7)
        datasets.push({
          label: `🔴 ${country} (7j)`,
          data: movingAvg7,
          borderColor: avg7Color,
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 4,
          borderDash: lineStyles.avg7.dash,
          order: 1,
        })
      }

      // Moyenne mobile 14 jours - Couleur dérivée du pays
      if (showMovingAverage14.value) {
        const movingAvg14 = calculateMovingAverage(dailyValues, 14)
        const avg14Color = getMovingAverageColor(baseColor, 14)
        datasets.push({
          label: `🟢 ${country} (14j)`,
          data: movingAvg14,
          borderColor: avg14Color,
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          borderWidth: 4,
          borderDash: lineStyles.avg14.dash,
          order: 1,
        })
      }

      // Ligne de tendance automatique (quand aucune moyenne mobile n'est sélectionnée)
      if (shouldShowTrendLine.value) {
        const dataForTrend = showMovingAverage7.value
          ? calculateMovingAverage(dailyValues, 7)
          : dailyValues
        const trendData = calculateTrendLine(dataForTrend)
        datasets.push({
          label: `📈 ${country} (tendance)`,
          data: trendData,
          borderColor: baseColor,
          backgroundColor: 'transparent',
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: lineStyles.trend.width,
          borderDash: lineStyles.trend.dash,
          order: 1,
          opacity: 0.8,
        })
      }
    }
  })

  return { labels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('fr-FR').format(context.parsed.y)
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date',
      },
      ticks: {
        maxTicksLimit: 12,
      },
    },
    y: {
      type: isLogarithmic.value ? 'logarithmic' : 'linear',
      display: true,
      title: {
        display: true,
        text: viewMode.value === 'cumulative' ? 'Cas cumulés' : 'Nouveaux cas / jour',
      },
      ticks: {
        callback: function (value) {
          return new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)
        },
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}))

// Computed pour obtenir les couleurs de prévisualisation par pays
const countryColors = computed(() => {
  const colorMap = {}
  covidStore.selectedCountries.forEach((country, index) => {
    const baseColor = colors[index % colors.length]
    colorMap[country] = {
      base: baseColor,
      avg7: getMovingAverageColor(baseColor, 7),
      avg14: getMovingAverageColor(baseColor, 14),
    }
  })
  return colorMap
})

function toggleScale() {
  isLogarithmic.value = !isLogarithmic.value
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'cumulative' ? 'daily' : 'cumulative'
}
</script>

<template>
  <div class="chart-view">
    <div class="card shadow-sm h-100">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="card-title mb-0">📊 Analyse des données</h5>
          <div class="d-flex gap-2 flex-wrap">
            <!-- Toggle vue cumulée/journalière -->
            <div class="btn-group btn-group-sm">
              <button
                class="btn"
                :class="viewMode === 'cumulative' ? 'btn-success' : 'btn-outline-success'"
                @click="toggleViewMode"
              >
                Cumulé
              </button>
              <button
                class="btn"
                :class="viewMode === 'daily' ? 'btn-success' : 'btn-outline-success'"
                @click="toggleViewMode"
              >
                Journalier
              </button>
            </div>

            <!-- Toggle échelle -->
            <div class="btn-group btn-group-sm">
              <button
                class="btn"
                :class="!isLogarithmic ? 'btn-primary' : 'btn-outline-secondary'"
                @click="toggleScale"
              >
                Linéaire
              </button>
              <button
                class="btn"
                :class="isLogarithmic ? 'btn-primary' : 'btn-outline-secondary'"
                @click="toggleScale"
              >
                Log
              </button>
            </div>
          </div>
        </div>

        <!-- Options d'analyse avancées -->
        <div v-if="viewMode === 'daily'" class="analysis-controls mb-2">
          <div class="row g-2 align-items-center">
            <!-- Moyennes mobiles avec couleurs par pays -->
            <div class="col-12 mb-2">
              <div class="d-flex align-items-center gap-2 mb-2">
                <strong class="small text-muted">Moyennes mobiles:</strong>
                <div class="form-check form-check-inline">
                  <input
                    v-model="showMovingAverage7"
                    class="form-check-input"
                    type="checkbox"
                    id="avg7"
                  />
                  <label class="form-check-label small fw-bold" for="avg7"> 🔴 7 jours </label>
                </div>
                <div class="form-check form-check-inline">
                  <input
                    v-model="showMovingAverage14"
                    class="form-check-input"
                    type="checkbox"
                    id="avg14"
                  />
                  <label class="form-check-label small fw-bold" for="avg14"> 🟢 14 jours </label>
                </div>
              </div>

              <!-- Message explicatif -->
              <div class="mb-2">
                <small class="text-muted">
                  📈 <strong>Tendance automatique :</strong>
                  {{
                    shouldShowTrendLine
                      ? 'Affichée automatiquement'
                      : 'Masquée (moyennes mobiles actives)'
                  }}
                </small>
              </div>

              <!-- Aperçu des couleurs par pays -->
              <div
                v-if="
                  (showMovingAverage7 || showMovingAverage14) && covidStore.selectedCountries.length
                "
                class="country-colors-preview"
              >
                <small class="text-muted d-block mb-2"><strong>Couleurs par pays:</strong></small>
                <div class="d-flex flex-wrap gap-2">
                  <div
                    v-for="country in covidStore.selectedCountries"
                    :key="country"
                    class="country-color-item bg-white rounded p-2 border"
                  >
                    <div
                      class="fw-bold small mb-1"
                      :style="{ color: countryColors[country]?.base }"
                    >
                      {{ country }}
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <div v-if="showMovingAverage7" class="d-flex align-items-center">
                        <div
                          class="color-line me-1"
                          :style="{
                            backgroundColor: countryColors[country]?.avg7,
                            borderTop: '3px dashed ' + countryColors[country]?.avg7,
                          }"
                        ></div>
                        <small style="font-size: 0.7rem">7j</small>
                      </div>
                      <div v-if="showMovingAverage14" class="d-flex align-items-center">
                        <div
                          class="color-line me-1"
                          :style="{
                            backgroundColor: countryColors[country]?.avg14,
                            borderTop: '3px dashed ' + countryColors[country]?.avg14,
                          }"
                        ></div>
                        <small style="font-size: 0.7rem">14j</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aide visuelle adaptée -->
          <div class="mt-2 p-2 bg-light rounded">
            <small class="text-muted d-block mb-1"><strong>Guide visuel:</strong></small>
            <div class="d-flex flex-wrap gap-3">
              <div class="d-flex align-items-center">
                <div
                  class="line-sample me-2"
                  :style="{
                    borderTop:
                      showMovingAverage7 || showMovingAverage14
                        ? '1px dotted rgba(59, 130, 246, 0.3)'
                        : shouldShowTrendLine
                          ? '2px solid rgba(59, 130, 246, 0.5)'
                          : '2px solid rgba(59, 130, 246, 0.7)',
                    width: '20px',
                  }"
                ></div>
                <small
                  class="text-muted"
                  :class="{ 'text-muted': showMovingAverage7 || showMovingAverage14 }"
                >
                  {{
                    showMovingAverage7 || showMovingAverage14
                      ? 'Données brutes (en arrière-plan)'
                      : 'Données quotidiennes'
                  }}
                </small>
              </div>
              <div v-if="showMovingAverage7" class="d-flex align-items-center">
                <div
                  class="line-sample me-2"
                  style="border-top: 4px dashed #e74c3c; width: 20px"
                ></div>
                <small class="fw-bold" style="color: #e74c3c">Moyenne 7j (couleurs par pays)</small>
              </div>
              <div v-if="showMovingAverage14" class="d-flex align-items-center">
                <div
                  class="line-sample me-2"
                  style="border-top: 4px dashed #2ecc71; width: 20px"
                ></div>
                <small class="fw-bold" style="color: #2ecc71"
                  >Moyenne 14j (couleurs par pays)</small
                >
              </div>
              <div v-if="shouldShowTrendLine" class="d-flex align-items-center">
                <div
                  class="line-sample me-2"
                  style="border-top: 2px dashed #666; width: 20px"
                ></div>
                <small class="text-muted fw-bold">Tendance (automatique)</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Options pour le mode cumulatif -->
        <div v-else class="analysis-controls mb-2">
          <div class="d-flex align-items-center">
            <small class="text-muted">
              📈 <strong>Tendance :</strong> Toujours affichée en mode cumulatif
            </small>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Statistiques d'analyse -->
        <div v-if="dataAnalysis && viewMode === 'daily'" class="analysis-stats mb-3">
          <div class="row g-2 text-center">
            <div v-for="(stats, country) in dataAnalysis" :key="country" class="col">
              <div
                class="bg-light rounded p-2 border-start border-3"
                :style="{ borderColor: countryColors[country]?.base + '!important' }"
              >
                <div class="fw-bold small text-primary">{{ country }}</div>
                <div class="d-flex align-items-center justify-content-center gap-1">
                  <small class="text-muted">{{ stats.avgDaily7 }}/j</small>
                  <span
                    class="badge badge-sm"
                    :class="{
                      'bg-success': stats.trendDirection === 'down',
                      'bg-warning': stats.trendDirection === 'stable',
                      'bg-danger': stats.trendDirection === 'up',
                    }"
                  >
                    {{
                      stats.trendDirection === 'up'
                        ? '↗️'
                        : stats.trendDirection === 'down'
                          ? '↘️'
                          : '➡️'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicateur de mode d'affichage -->
        <div
          v-if="viewMode === 'daily'"
          class="alert py-2 mb-3"
          :class="{
            'alert-info': showMovingAverage7 || showMovingAverage14,
            'alert-success': shouldShowTrendLine && !showMovingAverage7 && !showMovingAverage14,
          }"
        >
          <small>
            <strong v-if="showMovingAverage7 || showMovingAverage14"
              >📊 Mode analyse avancé :</strong
            >
            <strong v-else>📈 Mode tendance :</strong>

            <span v-if="showMovingAverage7 || showMovingAverage14">
              Les moyennes mobiles utilisent des couleurs dérivées de chaque pays pour une meilleure
              identification.
            </span>
            <span v-else>
              La ligne de tendance est automatiquement affichée pour révéler les patterns
              d'évolution.
            </span>
          </small>
        </div>

        <!-- Country selection -->
        <div class="mb-3">
          <label class="form-label small">Pays sélectionnés :</label>
          <div class="d-flex flex-wrap gap-2">
            <span
              v-for="(country, index) in covidStore.selectedCountries"
              :key="country"
              class="badge d-flex align-items-center"
              :style="{
                backgroundColor: colors[index % colors.length],
                color: 'white',
              }"
            >
              {{ country }}
              <button
                @click="covidStore.removeSelectedCountry(country)"
                class="btn-close btn-close-white ms-1"
                style="font-size: 0.6em"
                aria-label="Supprimer"
              ></button>
            </span>
          </div>
        </div>

        <!-- Country selector -->
        <div class="mb-3">
          <select
            class="form-select form-select-sm"
            @change="
              (e) => {
                if (e.target.value) {
                  covidStore.addSelectedCountry(e.target.value)
                  e.target.value = ''
                }
              }
            "
          >
            <option value="">+ Ajouter un pays...</option>
            <option
              v-for="country in covidStore.countries"
              :key="country"
              :value="country"
              :disabled="covidStore.selectedCountries.includes(country)"
            >
              {{ country }}
            </option>
          </select>
        </div>

        <!-- Chart container -->
        <div class="chart-container" style="position: relative; height: 360px">
          <Line v-if="chartData" ref="chartRef" :data="chartData" :options="chartOptions" />
          <div v-else class="d-flex align-items-center justify-content-center h-100">
            <div class="text-center text-muted">
              <div class="mb-2">📈</div>
              <p class="mb-0">Sélectionnez des pays</p>
              <small>pour afficher l'analyse</small>
            </div>
          </div>
        </div>

        <!-- Légende pour les lignes -->
        <div class="chart-legend mt-2">
          <small class="text-muted">
            <strong>Légende:</strong>
            <span class="ms-2">—— Données brutes</span>
            <span class="ms-2">- - - Moyenne mobile</span>
            <span class="ms-2">- · - · Tendance</span>
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container canvas {
  max-height: 360px;
}

.badge button {
  background: none;
  border: none;
  color: inherit;
}

.badge {
  font-size: 0.75em;
  padding: 0.375em 0.5em;
}

.analysis-controls {
  background: #f8f9fa;
  border-radius: 0.375rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
}

.analysis-stats .bg-light {
  border: 1px solid #e9ecef;
}

.badge-sm {
  font-size: 0.6em;
  padding: 0.2em 0.4em;
}

.chart-legend {
  border-top: 1px solid #e9ecef;
  padding-top: 0.5rem;
}

.line-sample {
  display: inline-block;
  height: 0;
}

.color-line {
  width: 20px;
  height: 3px;
  display: inline-block;
}

.country-color-item {
  min-width: 80px;
  font-size: 0.85rem;
}

.country-colors-preview {
  background: #f8f9fa;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.alert-info {
  background-color: #e7f3ff;
  border: 1px solid #b8daff;
  color: #0c5460;
}

.alert-success {
  background-color: #d1e7dd;
  border: 1px solid #badbcc;
  color: #0f5132;
}

@media (max-width: 768px) {
  .card-header {
    gap: 10px;
  }

  .btn-group-sm .btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .chart-container {
    height: 320px !important;
  }

  .analysis-controls {
    padding: 0.5rem;
  }

  .analysis-stats .col {
    min-width: 80px;
  }

  .country-color-item {
    min-width: 70px;
    font-size: 0.8rem;
  }
}
</style>
