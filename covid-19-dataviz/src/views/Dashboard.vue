<script setup>
// Le nom du fichier devient CovidDashboard.vue ou DashboardView.vue
import { onMounted } from 'vue'
import { useCovidStore } from '@/stores/covid'
import SummaryCards from '@/components/SummaryCards.vue'
import ChartView from '@/components/ChartView.vue'
import MapView from '@/components/MapView.vue'

const covidStore = useCovidStore()

onMounted(() => {
  covidStore.fetchAllData()
})
</script>

<template>
  <div class="dashboard">
    <div class="row">
      <div class="col-12">
        <h1 class="h2 mb-4">Tableau de bord COVID-19</h1>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="covidStore.loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3">Chargement des données COVID-19...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="covidStore.error" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Erreur de chargement</h4>
      <p>{{ covidStore.error }}</p>
      <button @click="covidStore.fetchAllData()" class="btn btn-outline-danger">Réessayer</button>
    </div>

    <!-- Main content -->
    <div v-else-if="covidStore.globalStats">
      <!-- Summary Cards -->
      <SummaryCards class="mb-4" />

      <!-- Maps and Charts - Inversé les proportions -->
      <div class="row">
        <!-- Carte mondiale - Plus large (8 colonnes) -->
        <div class="col-lg-8 mb-4">
          <MapView />
        </div>
        <!-- Graphiques - Plus petit (4 colonnes) -->
        <div class="col-lg-4 mb-4">
          <ChartView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0 15px;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0 10px;
  }

  /* Sur mobile, afficher la carte en premier */
  .col-lg-8 {
    order: 1;
  }

  .col-lg-4 {
    order: 2;
  }
}

@media (max-width: 992px) {
  /* Sur tablette, empiler verticalement */
  .row > div {
    margin-bottom: 1rem !important;
  }
}
</style>
