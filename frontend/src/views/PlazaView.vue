<script setup>
import JuegoPueblo from '@/juego/JuegoPueblo.vue'
</script>

<template>
  <main class="plaza">
    <h1>El Pueblo Duerme</h1>
    <JuegoPueblo />
    <p class="ayuda">WASD / flechas: moverse · E: usar tablón / pozo · N: día/noche (de noche eres lobo) · C: ir a la cama</p>
  </main>
</template>

<style scoped>
.plaza {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
}
h1 {
  margin: 0;
  font-size: 28px;
}
.ayuda {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}
</style>
