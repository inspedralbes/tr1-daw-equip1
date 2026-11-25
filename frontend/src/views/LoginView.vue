<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const router = useRouter()

const nom = ref('')
const avatarTriat = ref('')
const error = ref('')
const avatars = [
  '#e63946', '#f4a261', '#e9c46a', '#2a9d8f',
  '#457b9d', '#6a4c93', '#ff70a6', '#8d99ae'
]

function entrar() {
  const nomNet = nom.value.trim()
  if (nomNet.length < 2 || nomNet.length > 15) {
    error.value = 'El nom ha de tenir entre 2 i 15 caràcters'
    return
  }
  if (!avatarTriat.value) {
    error.value = 'Tria un avatar'
    return
  }
  error.value = ''
  store.guardarUsuari(nomNet, avatarTriat.value)
  router.push('/plaza')
}
</script>

<template>
  <div>
    <h1>Benvingut al poble</h1>

    <input v-model="nom" placeholder="Introdueix el teu nom" />

    <div>
      <button
        v-for="color in avatars"
        :key="color"
        :style="{ background: color, border: color === avatarTriat ? '3px solid black' : '1px solid gray' }"
        style="width: 40px; height: 40px"
        @click="avatarTriat = color"
      ></button>
    </div>

    <p v-if="error">{{ error }}</p>

    <button @click="entrar">Entrar</button>
  </div>
</template>