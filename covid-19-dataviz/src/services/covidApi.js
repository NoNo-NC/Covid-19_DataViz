import axios from 'axios'

const BASE_URL =
  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series'

class CovidApiService {
  async getConfirmedData() {
    try {
      const response = await axios.get(`${BASE_URL}/time_series_covid19_confirmed_global.csv`)
      return this.parseCSV(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des données confirmées:', error)
      throw error
    }
  }

  async getDeathsData() {
    try {
      const response = await axios.get(`${BASE_URL}/time_series_covid19_deaths_global.csv`)
      return this.parseCSV(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des données de décès:', error)
      throw error
    }
  }

  // Méthode supprimée car les données ne sont plus disponibles
  // async getRecoveredData() { ... }

  parseCSV(csvText) {
    const lines = csvText.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], data: [] }

    // Parse headers
    const headers = this.parseCSVLine(lines[0])
    const data = []

    // Parse data lines
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length >= headers.length) {
        const row = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })
        data.push(row)
      }
    }

    return { headers, data }
  }

  // Meilleure gestion du parsing CSV avec gestion des guillemets
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  // Méthode pour obtenir les données agrégées par pays
  getCountryData(parsedData, country) {
    return parsedData.data.filter(
      (row) => row['Country/Region']?.toLowerCase() === country.toLowerCase(),
    )
  }

  // Méthode pour obtenir la liste des pays uniques
  getCountries(parsedData) {
    const countries = new Set()
    parsedData.data.forEach((row) => {
      if (row['Country/Region']) {
        countries.add(row['Country/Region'])
      }
    })
    return Array.from(countries).sort()
  }

  // Méthode utilitaire pour obtenir les coordonnées d'un pays
  getCountryCoordinates(parsedData, country) {
    const countryRows = this.getCountryData(parsedData, country)
    if (countryRows.length === 0) return null

    // Calculer la moyenne des coordonnées si plusieurs régions
    let totalLat = 0
    let totalLng = 0
    let count = 0

    countryRows.forEach((row) => {
      const lat = parseFloat(row.Lat)
      const lng = parseFloat(row.Long)
      if (!isNaN(lat) && !isNaN(lng)) {
        totalLat += lat
        totalLng += lng
        count++
      }
    })

    return count > 0
      ? {
          lat: totalLat / count,
          lng: totalLng / count,
        }
      : null
  }
}

export default new CovidApiService()
