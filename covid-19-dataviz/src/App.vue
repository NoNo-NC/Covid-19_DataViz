<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import ThemeToggle from '@/components/ThemeToggle.vue'
import 'bootstrap/dist/css/bootstrap.min.css'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
  themeStore.setupSystemThemeListener()
})
</script>

<template>
  <div id="app" :class="themeStore.themeClass">
    <nav
      class="navbar navbar-expand-sm"
      :class="themeStore.isDarkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-light border-bottom'"
    >
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1"> 🦠 COVID-19 DataViz </span>

        <!-- Menu navigation responsive -->
        <div class="navbar-nav ms-auto d-flex flex-row align-items-center gap-2">
          <!-- Indicateur de données en temps réel -->
          <div class="nav-item">
            <span class="badge bg-success d-flex align-items-center gap-1">
              <span class="status-dot"></span>
              <small>Live</small>
            </span>
          </div>

          <!-- Toggle de thème -->
          <div class="nav-item">
            <ThemeToggle
              :show-text="false"
              size="sm"
              :variant="themeStore.isDarkMode ? 'outline-light' : 'outline-dark'"
            />
          </div>
        </div>
      </div>
    </nav>

    <main class="container-fluid mt-3">
      <router-view />
    </main>
  </div>
</template>

<style>
/* Variables CSS pour les thèmes */
:root {
  --bs-body-bg: #ffffff;
  --bs-body-color: #212529;
  --bs-border-color: #dee2e6;
  --covid-card-bg: #ffffff;
  --covid-card-border: #e9ecef;
  --covid-shadow: rgba(0, 0, 0, 0.1);
  --covid-text-muted: #6c757d;
}

[data-bs-theme='dark'] {
  --bs-body-bg: #0d1117;
  --bs-body-color: #c9d1d9;
  --bs-border-color: #30363d;
  --covid-card-bg: #161b22;
  --covid-card-border: #30363d;
  --covid-shadow: rgba(0, 0, 0, 0.3);
  --covid-text-muted: #8b949e;
}

/* Styles globaux pour l'application */
#app {
  min-height: 100vh;
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Styles pour les cartes */
.card {
  background-color: var(--covid-card-bg) !important;
  border-color: var(--covid-card-border) !important;
  box-shadow: 0 0.125rem 0.25rem var(--covid-shadow) !important;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.card-header {
  background-color: var(--covid-card-bg) !important;
  border-bottom-color: var(--covid-card-border) !important;
}

/* Styles pour les contrôles */
.bg-light {
  background-color: var(--covid-card-bg) !important;
  border-color: var(--covid-card-border) !important;
}

.text-muted {
  color: var(--covid-text-muted) !important;
}

/* Animation pour l'indicateur live */
.status-dot {
  width: 6px;
  height: 6px;
  background-color: #00ff00;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .navbar-brand {
    font-size: 1.1rem;
  }

  .container-fluid {
    padding-left: 10px;
    padding-right: 10px;
  }
}

/* Styles pour les graphiques en mode sombre */
[data-bs-theme='dark'] .chart-container {
  filter: brightness(0.9);
}

/* Amélioration des tooltips et popups Leaflet en mode sombre */
[data-bs-theme='dark'] .leaflet-popup-content-wrapper {
  background-color: var(--covid-card-bg);
  color: var(--bs-body-color);
}

[data-bs-theme='dark'] .leaflet-popup-tip {
  background-color: var(--covid-card-bg);
}

/* Styles pour les alertes */
[data-bs-theme='dark'] .alert-info {
  background-color: #0f2838;
  border-color: #1f4a5c;
  color: #9ec5d6;
}

[data-bs-theme='dark'] .alert-success {
  background-color: #0a2e0a;
  border-color: #1a5c1a;
  color: #9ed69e;
}

/* Styles pour les boutons */
[data-bs-theme='dark'] .btn-outline-primary {
  border-color: #4dabf7;
  color: #4dabf7;
}

[data-bs-theme='dark'] .btn-outline-primary:hover {
  background-color: #4dabf7;
  border-color: #4dabf7;
  color: #0d1117;
}

[data-bs-theme='dark'] .btn-outline-success {
  border-color: #51cf66;
  color: #51cf66;
}

[data-bs-theme='dark'] .btn-outline-success:hover {
  background-color: #51cf66;
  border-color: #51cf66;
  color: #0d1117;
}

[data-bs-theme='dark'] .btn-outline-secondary {
  border-color: #868e96;
  color: #868e96;
}

[data-bs-theme='dark'] .btn-outline-secondary:hover {
  background-color: #868e96;
  border-color: #868e96;
  color: #0d1117;
}
</style>
