import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const nom = ref('')
  const avatar = ref('')

  function guardarUsuari(nouNom, nouAvatar) {
    nom.value = nouNom
    avatar.value = nouAvatar
  }

  return { nom, avatar, guardarUsuari }
})