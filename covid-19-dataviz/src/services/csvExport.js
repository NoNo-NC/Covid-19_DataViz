class CSVExportService {
  // Fonction principale pour exporter les données COVID
  exportCovidData(confirmedData, deathsData, selectedCountries, globalStats) {
    const csvData = this.prepareCovidCSVData(
      confirmedData,
      deathsData,
      selectedCountries,
      globalStats,
    )
    const csvContent = this.arrayToCSV(csvData)
    this.downloadCSV(csvContent, `covid19-data-${this.getCurrentDateString()}.csv`)
  }

  // Exporter les données par pays sélectionnés (pour les graphiques)
  exportCountryData(confirmedData, deathsData, selectedCountries) {
    const csvData = this.prepareCountryCSVData(confirmedData, deathsData, selectedCountries)
    const csvContent = this.arrayToCSV(csvData)
    this.downloadCSV(csvContent, `covid19-countries-${this.getCurrentDateString()}.csv`)
  }

  // Exporter les statistiques globales
  exportGlobalStats(globalStats) {
    const csvData = this.prepareGlobalStatsCSV(globalStats)
    const csvContent = this.arrayToCSV(csvData)
    this.downloadCSV(csvContent, `covid19-global-stats-${this.getCurrentDateString()}.csv`)
  }

  // Préparer les données COVID complètes pour l'export
  prepareCovidCSVData(confirmedData, deathsData, selectedCountries) {
    if (!confirmedData || !confirmedData.data || !selectedCountries.length) {
      return []
    }

    const headers = confirmedData.headers.slice(4) // Ignorer les 4 premières colonnes
    const csvRows = []

    // En-tête du CSV
    const csvHeader = [
      'Pays',
      'Type',
      ...headers.slice(-30), // Prendre les 30 dernières dates pour éviter un fichier trop lourd
      'Total_Actuel',
      'Moyenne_7j',
      'Tendance',
    ]
    csvRows.push(csvHeader)

    // Pour chaque pays sélectionné
    selectedCountries.forEach((country) => {
      // Données de cas confirmés
      const confirmedCountryData = confirmedData.data.filter(
        (row) => row['Country/Region'] === country,
      )

      const confirmedValues = headers.map((date) => {
        return confirmedCountryData.reduce((sum, row) => {
          return sum + (parseInt(row[date]) || 0)
        }, 0)
      })

      // Données de décès si disponibles
      let deathValues = []
      if (deathsData && deathsData.data) {
        const deathCountryData = deathsData.data.filter((row) => row['Country/Region'] === country)

        deathValues = headers.map((date) => {
          return deathCountryData.reduce((sum, row) => {
            return sum + (parseInt(row[date]) || 0)
          }, 0)
        })
      }

      // Calculer les nouveaux cas journaliers
      const dailyCases = this.calculateDailyCases(confirmedValues)
      const avgDaily7 = this.calculateAverage(dailyCases.slice(-7))
      const trend = this.calculateTrend(dailyCases.slice(-14))

      // Ajouter la ligne des cas confirmés
      const confirmedRow = [
        country,
        'Cas_Confirmés',
        ...confirmedValues.slice(-30),
        confirmedValues[confirmedValues.length - 1] || 0,
        avgDaily7,
        this.formatTrend(trend),
      ]
      csvRows.push(confirmedRow)

      // Ajouter la ligne des décès si disponible
      if (deathValues.length > 0) {
        const dailyDeaths = this.calculateDailyCases(deathValues)
        const avgDeaths7 = this.calculateAverage(dailyDeaths.slice(-7))
        const deathTrend = this.calculateTrend(dailyDeaths.slice(-14))

        const deathRow = [
          country,
          'Décès',
          ...deathValues.slice(-30),
          deathValues[deathValues.length - 1] || 0,
          avgDeaths7,
          this.formatTrend(deathTrend),
        ]
        csvRows.push(deathRow)
      }

      // Ajouter la ligne des nouveaux cas journaliers
      const dailyRow = [
        country,
        'Nouveaux_Cas_Journaliers',
        ...dailyCases.slice(-30),
        dailyCases[dailyCases.length - 1] || 0,
        avgDaily7,
        this.formatTrend(trend),
      ]
      csvRows.push(dailyRow)
    })

    return csvRows
  }

  // Préparer les données par pays (version simplifiée)
  prepareCountryCSVData(confirmedData, deathsData, selectedCountries) {
    const csvRows = []
    const headers = confirmedData.headers.slice(4)

    // En-tête simplifié
    csvRows.push([
      'Pays',
      'Cas_Confirmés_Total',
      'Décès_Total',
      'Nouveaux_Cas_Hier',
      'Nouveaux_Décès_Hier',
      'Taux_Mortalité_%',
      'Dernière_Mise_à_Jour',
    ])

    selectedCountries.forEach((country) => {
      const confirmedCountryData = confirmedData.data.filter(
        (row) => row['Country/Region'] === country,
      )

      const confirmedValues = headers.map((date) => {
        return confirmedCountryData.reduce((sum, row) => {
          return sum + (parseInt(row[date]) || 0)
        }, 0)
      })

      let deathValues = []
      if (deathsData && deathsData.data) {
        const deathCountryData = deathsData.data.filter((row) => row['Country/Region'] === country)

        deathValues = headers.map((date) => {
          return deathCountryData.reduce((sum, row) => {
            return sum + (parseInt(row[date]) || 0)
          }, 0)
        })
      }

      const totalConfirmed = confirmedValues[confirmedValues.length - 1] || 0
      const totalDeaths = deathValues[deathValues.length - 1] || 0

      // Nouveaux cas et décès (différence avec le jour précédent)
      const newCases = totalConfirmed - (confirmedValues[confirmedValues.length - 2] || 0)
      const newDeaths = totalDeaths - (deathValues[deathValues.length - 2] || 0)

      // Taux de mortalité
      const mortalityRate =
        totalConfirmed > 0 ? ((totalDeaths / totalConfirmed) * 100).toFixed(2) : '0.00'

      csvRows.push([
        country,
        totalConfirmed,
        totalDeaths,
        Math.max(0, newCases),
        Math.max(0, newDeaths),
        mortalityRate,
        headers[headers.length - 1],
      ])
    })

    return csvRows
  }

  // Préparer les statistiques globales
  prepareGlobalStatsCSV(globalStats) {
    if (!globalStats) return []

    return [
      ['Statistique', 'Valeur', 'Type'],
      ['Cas confirmés totaux', globalStats.confirmed, 'Officiel'],
      ['Décès totaux', globalStats.deaths, 'Officiel'],
      ['Guérisons estimées', globalStats.recovered, 'Estimé'],
      ['Cas actifs estimés', globalStats.active, 'Estimé'],
      [
        'Taux de mortalité (%)',
        ((globalStats.deaths / globalStats.confirmed) * 100).toFixed(2),
        'Calculé',
      ],
      [
        'Taux de guérison (%)',
        ((globalStats.recovered / globalStats.confirmed) * 100).toFixed(2),
        'Estimé',
      ],
      ['Dernière mise à jour', globalStats.lastUpdate, 'Date'],
    ]
  }

  // Fonctions utilitaires
  calculateDailyCases(cumulativeData) {
    const dailyCases = [0]
    for (let i = 1; i < cumulativeData.length; i++) {
      const current = cumulativeData[i] || 0
      const previous = cumulativeData[i - 1] || 0
      dailyCases.push(Math.max(0, current - previous))
    }
    return dailyCases
  }

  calculateAverage(data) {
    const validData = data.filter((val) => val !== null && val !== undefined && !isNaN(val))
    return validData.length > 0
      ? Math.round(validData.reduce((a, b) => a + b, 0) / validData.length)
      : 0
  }

  calculateTrend(data) {
    if (data.length < 7) return 0
    const firstHalf = data.slice(0, 7)
    const secondHalf = data.slice(7, 14)
    const avg1 = this.calculateAverage(firstHalf)
    const avg2 = this.calculateAverage(secondHalf)
    return avg2 - avg1
  }

  formatTrend(trend) {
    if (trend > 5) return 'Hausse'
    if (trend < -5) return 'Baisse'
    return 'Stable'
  }

  // Convertir un tableau en format CSV
  arrayToCSV(data) {
    return data
      .map((row) =>
        row
          .map((field) => {
            // Échapper les guillemets et entourer de guillemets si nécessaire
            const fieldStr = String(field)
            if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
              return `"${fieldStr.replace(/"/g, '""')}"`
            }
            return fieldStr
          })
          .join(','),
      )
      .join('\n')
  }

  // Déclencher le téléchargement
  downloadCSV(content, filename) {
    const BOM = '\uFEFF' // BOM pour UTF-8
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Obtenir la date actuelle au format string
  getCurrentDateString() {
    const now = new Date()
    return now.toISOString().split('T')[0] // Format YYYY-MM-DD
  }
}

export default new CSVExportService()
