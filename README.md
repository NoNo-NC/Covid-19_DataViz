# COVID-19 DataViz

[![CI/CD Pipeline](https://github.com/votre-username/covid-19-dataviz/actions/workflows/ci.yml/badge.svg)](https://github.com/votre-username/covid-19-dataviz/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://votre-username.github.io/covid-19-dataviz/)

> Tableau de bord interactif pour visualiser en temps réel l'évolution de la pandémie de COVID-19 à travers le monde.

![COVID-19 DataViz Screenshot](https://via.placeholder.com/800x400/0d6efd/ffffff?text=COVID-19+DataViz+Dashboard)

## 🌟 Fonctionnalités

- 📊 **Graphiques interactifs** : Évolution temporelle des cas avec Chart.js (échelle linéaire/logarithmique)
- 🗺️ **Carte mondiale interactive** : Visualisation géographique avec Leaflet.js et marqueurs cliquables
- 📈 **Statistiques globales** : Cartes de résumé des données clés (cas confirmés, décès, estimations)
- 🔄 **Données en temps réel** : Récupération automatique depuis Johns Hopkins CSSE
- 📱 **Interface responsive** : Optimisée pour mobile, tablette et desktop
- 🎨 **Design moderne** : Interface utilisateur intuitive avec Bootstrap 5
- ⚡ **Performance** : Application SPA rapide avec Vue.js 3 et Vite

## 🛠️ Technologies

### Frontend
- **Vue.js 3** - Framework JavaScript progressif
- **Vite** - Build tool rapide et moderne
- **Bootstrap 5** - Framework CSS responsive
- **Pinia** - Gestion d'état moderne pour Vue

### Visualisation
- **Chart.js** - Graphiques interactifs
- **vue-chartjs** - Intégration Vue pour Chart.js
- **Leaflet.js** - Cartographie interactive

### Outils et CI/CD
- **ESLint** + **Prettier** - Qualité et formatage du code
- **GitHub Actions** - CI/CD automatisé
- **Axios** - Client HTTP pour les APIs

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20.x ou supérieur
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-username/covid-19-dataviz.git
cd covid-19-dataviz/covid-19-dataviz

# Installer les dépendances
npm install

# Développement
npm run dev              # Serveur de développement avec hot-reload
npm run preview          # Prévisualisation du build de production

# Build et déploiement  
npm run build            # Build de production optimisé

# Qualité du code
npm run lint             # Correction automatique ESLint
npm run lint:check       # Vérification ESLint sans correction
npm run format           # Formatage avec Prettier
npm run format:check     # Vérification Prettier sans correction

# Tests et validation
npm run test:api         # Test des endpoints API COVID-19
npm run validate         # Validation complète (lint + format + build)

covid-19-dataviz/
├── 🔧 .github/workflows/     # GitHub Actions CI/CD
├── 📦 src/
│   ├── 🎯 components/        # Composants Vue réutilisables
│   │   ├── ChartView.vue     # Graphiques Chart.js
│   │   ├── MapView.vue       # Carte Leaflet interactive
│   │   └── SummaryCards.vue  # Cartes de statistiques
│   ├── 🗂️ services/          # Services API
│   │   └── covidApi.js       # Client API Johns Hopkins
│   ├── 🏪 stores/            # Stores Pinia
│   │   └── covid.js          # État global COVID-19
│   ├── 📄 views/             # Pages/vues principales
│   │   └── Dashboard.vue     # Tableau de bord principal
│   ├── 🛣️ router/            # Configuration Vue Router
│   └── App.vue               # Composant racine
├── 🧪 scripts/               # Scripts utilitaires
├── 📋 package.json           # Dépendances et scripts
└── ⚙️ vite.config.js         # Configuration Vite
