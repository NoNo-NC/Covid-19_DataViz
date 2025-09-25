<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
</script>

<template>
  <div id="app">
    <nav class="navbar navbar-dark bg-dark">
      <div class="container-fluid">
        <span class="navbar-brand mb-0 h1">COVID-19 DataViz</span>
      </div>
    </nav>
    
    <main class="container-fluid mt-3">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
