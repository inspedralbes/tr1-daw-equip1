<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const router = useRouter()

const nom = ref('')
const avatarTriat = ref('')
const error = ref('')

function entrar() {
  const nomNet = nom.value.trim()
  if (nomNet.length < 2 || nomNet.length > 15) {
    error.value = 'El nom ha de tenir entre 2 i 15 caràcters'
    return
  }

  error.value = ''
  store.guardarUsuari(nomNet, avatarTriat.value)
  router.push('/salas')
}
</script>

<template>
  <div>
    <h1>Benvingut al poble</h1>

    <input v-model="nom" placeholder="Introdueix el teu nom" />

    <p v-if="error">{{ error }}</p>

    <button @click="entrar">Entrar</button>
  </div>
</template>