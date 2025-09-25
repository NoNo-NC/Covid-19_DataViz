import axios from 'axios'

const BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series'

async function testApiEndpoints() {
  console.log('🧪 Testing COVID-19 API endpoints...\n')
  
  const endpoints = [
    {
      name: 'Confirmed Cases',
      url: `${BASE_URL}/time_series_covid19_confirmed_global.csv`
    },
    {
      name: 'Deaths',
      url: `${BASE_URL}/time_series_covid19_deaths_global.csv`
    }
  ]
  
  let allTestsPassed = true
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint.name}...`)
      
      const startTime = Date.now()
      const response = await axios.get(endpoint.url, { timeout: 10000 })
      const duration = Date.now() - startTime
      
      // Vérifications de base
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      if (!response.data || response.data.length < 100) {
        throw new Error('Response data is too short or empty')
      }
      
      // Vérifier que c'est bien du CSV
      const lines = response.data.split('\n')
      if (lines.length < 10) {
        throw new Error('CSV does not contain enough lines')
      }
      
      // Vérifier l'en-tête
      const header = lines[0]
      if (!header.includes('Country/Region') || !header.includes('Lat') || !header.includes('Long')) {
        throw new Error('CSV header is missing required columns')
      }
      
      console.log(`✅ ${endpoint.name}: OK (${duration}ms, ${lines.length} lines)`)
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: FAILED`)
      console.log(`   Error: ${error.message}`)
      allTestsPassed = false
    }
  }
  
  console.log(`\n📊 Test Results:`)
  if (allTestsPassed) {
    console.log('✅ All API endpoints are working correctly!')
    process.exit(0)
  } else {
    console.log('❌ Some API endpoints failed!')
    process.exit(1)
  }
}

// Exécuter les tests
testApiEndpoints()