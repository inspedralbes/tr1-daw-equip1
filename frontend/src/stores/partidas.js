import { defineStore } from 'pinia'
import { ref } from 'vue'
import { socket } from '@/socket' // el mismo socket que ya usáis

export const usePartidasStore = defineStore('partidas', () => {
  const partidas = ref([])

  // el servidor manda la lista completa cada vez que cambia
  socket.on('partidas:lista', (lista) => (partidas.value = lista))

  function agregar(partida) {
    socket.emit('partidas:crear', partida)
  }

  return { partidas, agregar }
})