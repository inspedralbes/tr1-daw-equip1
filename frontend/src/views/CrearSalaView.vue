<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePartidasStore } from '@/stores/partidas'

const router = useRouter()
const store = usePartidasStore()

const maxPersonas = ref(6)
const tipo = ref('publica')
const codigo = Math.random().toString(36).substring(2, 7).toUpperCase()
const titulo = ref('')

function crearPartida() {
  if (!titulo.value.trim()) return alert('Pon un título a la partida')

  store.agregar({
    titulo: titulo.value.trim(),
    max: maxPersonas.value,
    tipo: tipo.value,
    codigo
  })

  router.push('/salas')
}
</script>

<template>
  <div>
    <h1>Crear partida</h1>

     <div>
      <label>Título de la partida</label>
      <input v-model="titulo" type="text" placeholder="Partida de Juan" />
    </div>

    <div>
      <label>Máximo de personas:</label>
      <input v-model="maxPersonas" type="number" min="6" max="8" />
    </div>

    <div>
      <label>Tipo:</label>
      <select v-model="tipo">
        <option value="publica">Pública</option>
        <option value="privada">Privada</option>
      </select>
    </div>

    <div v-if="tipo === 'privada'">
      <p>Código de la partida: <strong>{{ codigo }}</strong></p>
    </div>

    <button @click="crearPartida">Crear partida</button>
  </div>
</template>