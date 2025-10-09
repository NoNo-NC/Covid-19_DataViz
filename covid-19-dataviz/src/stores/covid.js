import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import covidApi from '@/services/covidApi'

export const useCovidStore = defineStore('covid', () => {
  const confirmedData = ref(null)
  const deathsData = ref(null)
  const recoveredData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedCountries = ref(['US', 'Italy', 'France', 'Germany'])

  const countries = computed(() => {
    if (!confirmedData.value) return []
    return covidApi.getCountries(confirmedData.value)
  })

  const globalStats = computed(() => {
    if (!confirmedData.value || !deathsData.value) return null

    // Calcul des statistiques globales (dernière date disponible)
    const headers = confirmedData.value.headers
    const lastDateIndex = headers.length - 1
    const lastDate = headers[lastDateIndex]

    let totalConfirmed = 0
    let totalDeaths = 0

    confirmedData.value.data.forEach((row) => {
      totalConfirmed += parseInt(row[lastDate] || 0)
    })

    deathsData.value.data.forEach((row) => {
      totalDeaths += parseInt(row[lastDate] || 0)
    })

    // Estimation des guérisons (environ 97-98% des cas non mortels)
    const estimatedRecovered = Math.round((totalConfirmed - totalDeaths) * 0.975)

    return {
      confirmed: totalConfirmed,
      deaths: totalDeaths,
      recovered: estimatedRecovered, // Données estimées
      active: totalConfirmed - totalDeaths - estimatedRecovered,
      lastUpdate: lastDate,
      recoveredEstimated: true, // Flag pour indiquer que c'est une estimation
    }
  })

  async function fetchAllData() {
    loading.value = true
    error.value = null

    try {
      const [confirmed, deaths] = await Promise.all([
        covidApi.getConfirmedData(),
        covidApi.getDeathsData(),
      ])

      confirmedData.value = confirmed
      deathsData.value = deaths
      recoveredData.value = null // Plus de données officielles
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function addSelectedCountry(country) {
    if (!selectedCountries.value.includes(country)) {
      selectedCountries.value.push(country)
    }
  }

  function removeSelectedCountry(country) {
    const index = selectedCountries.value.indexOf(country)
    if (index > -1) {
      selectedCountries.value.splice(index, 1)
    }
  }

  return {
    confirmedData,
    deathsData,
    recoveredData,
    loading,
    error,
    selectedCountries,
    countries,
    globalStats,
    fetchAllData,
    addSelectedCountry,
    removeSelectedCountry,
  }
})
