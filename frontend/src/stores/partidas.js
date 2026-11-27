import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePartidasStore = defineStore('partidas', () => {
  const partidas = ref([])

  function agregar(partida) {
    partidas.value.push({ id: Date.now(), ...partida })
  }

  return { partidas, agregar }
})