<template>
  <div id="app">
    <BlackHole />
  </div>
</template>

<script setup lang="ts">
import BlackHole from './components/BlackHole.vue'
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>