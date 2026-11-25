import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import PlazaView from '@/views/PlazaView.vue'
import SalasView from '@/views/SalasView.vue'
import CrearSalaView from '@/views/CrearSalaView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/plaza', name: 'plaza', component: PlazaView },
    { path: '/salas', name: 'salas', component: SalasView },
    { path: '/crear', name: 'crear', component: CrearSalaView }
  ]
})

export default router