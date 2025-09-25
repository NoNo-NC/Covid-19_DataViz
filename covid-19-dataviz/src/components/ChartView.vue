<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
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
  LogarithmicScale
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
  Legend
)

const covidStore = useCovidStore()
const chartRef = ref(null)
const isLogarithmic = ref(false)

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

const chartData = computed(() => {
  if (!covidStore.confirmedData || !covidStore.selectedCountries.length) {
    return null
  }

  const headers = covidStore.confirmedData.headers.slice(4) // Ignorer les 4 premières colonnes
  const labels = headers.map(date => {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
  })

  const datasets = covidStore.selectedCountries.map((country, index) => {
    const countryData = covidStore.confirmedData.data.filter(
      row => row['Country/Region'] === country
    )

    const values = headers.map(date => {
      return countryData.reduce((sum, row) => {
        return sum + (parseInt(row[date]) || 0)
      }, 0)
    })

    return {
      label: country,
      data: values,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 4,
    }
  })

  return {
    labels,
    datasets
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(context.parsed.y)}`
        }
      }
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date'
      },
      ticks: {
        maxTicksLimit: 10
      }
    },
    y: {
      type: isLogarithmic.value ? 'logarithmic' : 'linear',
      display: true,
      title: {
        display: true,
        text: 'Nombre de cas'
      },
      ticks: {
        callback: function(value) {
          return new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)
        }
      }
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}))

function toggleScale() {
  isLogarithmic.value = !isLogarithmic.value
}
</script>

<template>
  <div class="chart-view">
    <div class="card shadow-sm h-100">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
        <h5 class="card-title mb-0">📊 Évolution des cas</h5>
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
      
      <div class="card-body">
        <!-- Country selection -->
        <div class="mb-3">
          <label class="form-label small">Pays sélectionnés :</label>
          <div class="d-flex flex-wrap gap-2">
            <span 
              v-for="country in covidStore.selectedCountries" 
              :key="country"
              class="badge bg-primary d-flex align-items-center"
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
            @change="(e) => { 
              if (e.target.value) {
                covidStore.addSelectedCountry(e.target.value)
                e.target.value = ''
              }
            }"
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
        <div class="chart-container" style="position: relative; height: 300px;">
          <Line 
            v-if="chartData"
            ref="chartRef"
            :data="chartData" 
            :options="chartOptions"
          />
          <div v-else class="d-flex align-items-center justify-content-center h-100">
            <div class="text-center text-muted">
              <div class="mb-2">📈</div>
              <p class="mb-0">Sélectionnez des pays</p>
              <small>pour afficher le graphique</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container canvas {
  max-height: 300px;
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

@media (max-width: 768px) {
  .card-header {
    gap: 10px;
  }
  
  .btn-group-sm .btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .chart-container {
    height: 250px !important;
  }
}
</style>