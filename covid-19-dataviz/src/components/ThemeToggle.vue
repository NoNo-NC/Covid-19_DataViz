<script setup>
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// Props optionnelles pour personnaliser l'affichage
const props = defineProps({
  size: {
    type: String,
    default: 'sm', // 'sm', 'md', 'lg'
  },
  showText: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: 'outline-secondary', // Bootstrap button variant
  },
})

const buttonClass = `btn-${props.variant} btn-${props.size}`
</script>

<template>
  <button
    @click="themeStore.toggleTheme"
    :class="['btn', buttonClass, 'd-flex', 'align-items-center', 'gap-2']"
    :title="themeStore.isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'"
    type="button"
  >
    <!-- Icône animée -->
    <span class="theme-icon" :class="{ rotating: true }">
      {{ themeStore.isDarkMode ? '☀️' : '🌙' }}
    </span>

    <!-- Texte optionnel -->
    <span v-if="showText" class="theme-text">
      {{ themeStore.isDarkMode ? 'Clair' : 'Sombre' }}
    </span>
  </button>
</template>

<style scoped>
.theme-icon {
  font-size: 1.1em;
  transition: transform 0.3s ease;
  display: inline-block;
}

.btn:hover .theme-icon {
  transform: scale(1.1);
}

.rotating {
  animation: subtle-rotate 0.3s ease;
}

@keyframes subtle-rotate {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.theme-text {
  font-size: 0.9em;
  font-weight: 500;
}

/* Styles adaptatifs selon la taille */
.btn-sm .theme-icon {
  font-size: 1em;
}

.btn-lg .theme-icon {
  font-size: 1.3em;
}

.btn-sm .theme-text {
  font-size: 0.8em;
}

.btn-lg .theme-text {
  font-size: 1em;
}
</style>
