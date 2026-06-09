import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../components/LoginView.vue'
import VoucherList from '../components/VoucherList.vue'
import PrintView from '../components/PrintView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: VoucherList
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/print',
      name: 'print',
      component: PrintView
    }
  ]
})

export default router
