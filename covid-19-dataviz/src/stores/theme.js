import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  // État réactif du thème
  const isDarkMode = ref(false)

  // Computed pour obtenir le nom du thème
  const currentTheme = computed(() => (isDarkMode.value ? 'dark' : 'light'))

  // Computed pour les classes CSS
  const themeClass = computed(() => (isDarkMode.value ? 'theme-dark' : 'theme-light'))

  // Initialisation du thème
  function initTheme() {
    // Vérifier si un thème est sauvegardé
    const savedTheme = localStorage.getItem('covid-dataviz-theme')

    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      // Utiliser la préférence système si aucun thème sauvegardé
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
    }

    applyTheme()
  }

  // Appliquer le thème au DOM
  function applyTheme() {
    const htmlElement = document.documentElement

    if (isDarkMode.value) {
      htmlElement.classList.add('theme-dark')
      htmlElement.classList.remove('theme-light')
      htmlElement.setAttribute('data-bs-theme', 'dark')
    } else {
      htmlElement.classList.add('theme-light')
      htmlElement.classList.remove('theme-dark')
      htmlElement.setAttribute('data-bs-theme', 'light')
    }
  }

  // Basculer le thème
  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
  }

  // Définir un thème spécifique
  function setTheme(theme) {
    isDarkMode.value = theme === 'dark'
  }

  // Watcher pour sauvegarder et appliquer les changements
  watch(isDarkMode, (newValue) => {
    localStorage.setItem('covid-dataviz-theme', newValue ? 'dark' : 'light')
    applyTheme()
  })

  // Écouter les changements de préférence système
  function setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    mediaQuery.addEventListener('change', (e) => {
      // Ne changer automatiquement que si aucun thème n'est explicitement sauvegardé
      const savedTheme = localStorage.getItem('covid-dataviz-theme')
      if (!savedTheme) {
        isDarkMode.value = e.matches
      }
    })
  }

  return {
    isDarkMode,
    currentTheme,
    themeClass,
    initTheme,
    toggleTheme,
    setTheme,
    setupSystemThemeListener,
  }
})
