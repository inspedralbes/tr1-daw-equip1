<script setup>
import { ref, watch } from 'vue'

const maxPersonas = ref(4)
const tipo = ref('publica')
const codigo = ref('')

function generarCodigo() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

watch(tipo, (partida) => {
  if (partida === 'privada') {
    codigo.value = generarCodigo()
  } else {
    codigo.value = ''
  }
})

function comenzar() {
  console.log('Crear partida:', {
    maxPersonas: maxPersonas.value,
    tipo: tipo.value,
    codigo: codigo.value
  })
}
</script>

<template>
  <div>
    <h1>Crear partida</h1>

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

    <button @click="comenzar">Comenzar</button>
  </div>
</template>