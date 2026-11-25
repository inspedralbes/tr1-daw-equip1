<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const codigo = ref('')
const router = useRouter()
const store = useUserStore()

function unirse() {
    router.push('/partida')
}

function crear() {
    router.push('/crear')
}
</script>

<template>
  <div>
    <div>
      <input v-model="codigo" placeholder="Código" />
      <button @click="unirse">Unirse</button>
    </div>

    <h2>Partidas públicas</h2>
    <ul>
      <!-- aquí irán las partidas -->
    </ul>

    <div style="text-align: right">
      <button @click="crear">Crear</button>
    </div>
  </div>
</template>