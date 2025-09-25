import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**', 
      '**/dist-ssr/**', 
      '**/coverage/**',
      '**/scripts/**' // Ignorer les scripts pour éviter les problèmes Node.js
    ]
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  
  {
    rules: {
      'vue/multi-word-component-names': 'off', // Désactiver cette règle
      'vue/no-parsing-error': 'error'
    }
  },
  
  skipFormatting,
]