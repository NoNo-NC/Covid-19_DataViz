<script setup>
import { computed } from 'vue'
import { useCovidStore } from '@/stores/covid'

const covidStore = useCovidStore()

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const cards = computed(() => [
  {
    title: 'Cas confirmés',
    value: covidStore.globalStats?.confirmed || 0,
    icon: '🔵',
    bgClass: 'bg-primary',
    textClass: 'text-primary'
  },
  {
    title: 'Décès',
    value: covidStore.globalStats?.deaths || 0,
    icon: '🔴',
    bgClass: 'bg-danger',
    textClass: 'text-danger'
  },
  {
    title: 'Guérisons (est.)',
    value: covidStore.globalStats?.recovered || 0,
    icon: '🟢',
    bgClass: 'bg-success',
    textClass: 'text-success',
    estimated: true
  },
  {
    title: 'Cas actifs (est.)',
    value: covidStore.globalStats?.active || 0,
    icon: '🟡',
    bgClass: 'bg-warning',
    textClass: 'text-warning',
    estimated: true
  }
])
</script>

<template>
  <div class="summary-cards">
    <div class="row g-3">
      <div v-for="card in cards" :key="card.title" class="col-md-3 col-sm-6">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex align-items-center">
            <div class="flex-shrink-0 me-3">
              <div :class="['rounded-circle d-flex align-items-center justify-content-center', card.bgClass]" 
                   style="width: 50px; height: 50px;">
                <span class="fs-4">{{ card.icon }}</span>
              </div>
            </div>
            <div class="flex-grow-1">
              <h6 class="card-title text-muted mb-1">
                {{ card.title }}
                <i v-if="card.estimated" 
                   class="bi bi-info-circle-fill text-muted ms-1" 
                   style="font-size: 0.7em"
                   title="Données estimées"
                ></i>
              </h6>
              <h3 :class="['card-text fw-bold mb-0', card.textClass]">
                {{ formatNumber(card.value) }}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="text-center mt-3">
      <div v-if="covidStore.globalStats?.lastUpdate" class="text-muted mb-1">
        <small>Dernière mise à jour : {{ formatDate(covidStore.globalStats.lastUpdate) }}</small>
      </div>
      <div v-if="covidStore.globalStats?.recoveredEstimated" class="text-muted">
        <small>
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          Les guérisons et cas actifs sont estimés (Johns Hopkins a arrêté ces données en mars 2023)
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-cards .card {
  transition: transform 0.2s ease-in-out;
}

.summary-cards .card:hover {
  transform: translateY(-2px);
}

.bg-primary {
  background-color: #0d6efd !important;
}

.bg-danger {
  background-color: #dc3545 !important;
}

.bg-success {
  background-color: #198754 !important;
}

.bg-warning {
  background-color: #ffc107 !important;
}

/* Style pour les icônes d'information */
.bi-info-circle-fill::before {
  content: "ⓘ";
}

.bi-exclamation-triangle-fill::before {
  content: "⚠️";
}
</style>