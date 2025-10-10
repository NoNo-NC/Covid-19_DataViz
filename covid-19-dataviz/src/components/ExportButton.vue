<script setup>
import { ref } from 'vue'
import { useCovidStore } from '@/stores/covid'
import csvExport from '@/services/csvExport'

const covidStore = useCovidStore()
const showDropdown = ref(false)
const isExporting = ref(false)

// Utiliser directement defineProps sans assigner à une variable
defineProps({
  size: {
    type: String,
    default: 'sm',
  },
  variant: {
    type: String,
    default: 'outline-success',
  },
})

// Fonctions d'export
async function exportFullData() {
  if (!covidStore.confirmedData || !covidStore.selectedCountries.length) {
    alert("Aucune donnée disponible pour l'export")
    return
  }

  isExporting.value = true
  try {
    csvExport.exportCovidData(
      covidStore.confirmedData,
      covidStore.deathsData,
      covidStore.selectedCountries,
      covidStore.globalStats,
    )
  } finally {
    isExporting.value = false
    showDropdown.value = false
  }
}

async function exportCountryData() {
  if (!covidStore.confirmedData || !covidStore.selectedCountries.length) {
    alert('Veuillez sélectionner au moins un pays')
    return
  }

  isExporting.value = true
  try {
    csvExport.exportCountryData(
      covidStore.confirmedData,
      covidStore.deathsData,
      covidStore.selectedCountries,
    )
  } finally {
    isExporting.value = false
    showDropdown.value = false
  }
}

async function exportGlobalStats() {
  if (!covidStore.globalStats) {
    alert('Statistiques globales non disponibles')
    return
  }

  isExporting.value = true
  try {
    csvExport.exportGlobalStats(covidStore.globalStats)
  } finally {
    isExporting.value = false
    showDropdown.value = false
  }
}

// Fermer le dropdown quand on clique ailleurs
function handleClickOutside(event) {
  if (!event.target.closest('.export-dropdown')) {
    showDropdown.value = false
  }
}

// Ajouter/supprimer l'event listener
function toggleDropdown() {
  showDropdown.value = !showDropdown.value

  if (showDropdown.value) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
}

// Cleanup
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="export-dropdown position-relative">
    <button
      @click="toggleDropdown"
      :class="['btn', 'btn-outline-success', 'btn-sm', 'd-flex', 'align-items-center', 'gap-2']"
      :disabled="isExporting || covidStore.loading"
      type="button"
    >
      <span v-if="isExporting" class="spinner-border spinner-border-sm" role="status"></span>
      <span v-else>📊</span>
      <span>Export CSV</span>
      <span class="dropdown-arrow">{{ showDropdown ? '▲' : '▼' }}</span>
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="showDropdown"
      class="dropdown-menu show position-absolute"
      style="z-index: 1050; min-width: 250px"
    >
      <h6 class="dropdown-header">📈 Exporter les données</h6>

      <button
        @click="exportCountryData"
        class="dropdown-item d-flex align-items-center"
        :disabled="!covidStore.selectedCountries.length"
      >
        <span class="me-2">🌍</span>
        <div>
          <div class="fw-bold">Données par pays</div>
          <small class="text-muted">Pays sélectionnés avec résumé</small>
        </div>
      </button>

      <button
        @click="exportFullData"
        class="dropdown-item d-flex align-items-center"
        :disabled="!covidStore.selectedCountries.length"
      >
        <span class="me-2">📊</span>
        <div>
          <div class="fw-bold">Données complètes</div>
          <small class="text-muted">Évolution temporelle détaillée</small>
        </div>
      </button>

      <button
        @click="exportGlobalStats"
        class="dropdown-item d-flex align-items-center"
        :disabled="!covidStore.globalStats"
      >
        <span class="me-2">🌐</span>
        <div>
          <div class="fw-bold">Statistiques mondiales</div>
          <small class="text-muted">Résumé global actuel</small>
        </div>
      </button>

      <div class="dropdown-divider"></div>

      <div class="px-3 py-2">
        <small class="text-muted">
          📝 Les fichiers CSV sont compatibles Excel<br />
          🎯 Données optimisées pour l'analyse
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-dropdown {
  display: inline-block;
}

.dropdown-arrow {
  font-size: 0.8em;
  transition: transform 0.2s ease;
}

.dropdown-menu {
  border: 1px solid var(--bs-border-color);
  border-radius: 0.375rem;
  background-color: var(--covid-card-bg);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  margin-top: 0.25rem;
}

.dropdown-item {
  color: var(--bs-body-color);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover:not(:disabled) {
  background-color: var(--bs-primary);
  color: white;
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-header {
  color: var(--covid-text-muted);
  font-size: 0.875rem;
  padding: 0.5rem 1rem 0.25rem;
  margin-bottom: 0;
}

.dropdown-divider {
  border-top: 1px solid var(--bs-border-color);
  margin: 0.5rem 0;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dropdown-menu {
    min-width: 200px;
    right: 0;
    left: auto;
  }
}
</style>
