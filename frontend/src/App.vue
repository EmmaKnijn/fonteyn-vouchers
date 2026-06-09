<template>
  <div class="app-wrapper">
    <nav v-if="!isPrintRoute" class="navbar">
      <div class="nav-content">
        <h1 class="logo-text">Fonteyn Vouchers</h1>
        <div class="nav-actions" v-if="isAuthenticated">
          <span class="user-role">{{ userRole }}</span>
          <button @click="logout" class="btn btn-danger">Logout</button>
        </div>
      </div>
    </nav>
    <main :class="{ 'main-content': !isPrintRoute }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const isAuthenticated = ref(false)
const userRole = ref('')

// Configure axios
// Use absolute path for API requests
axios.defaults.baseURL = 'http://vouchers.fonteyn.local'
axios.defaults.withCredentials = true

const checkAuth = async () => {
  try {
    const res = await axios.get('/api/auth/me')
    isAuthenticated.value = true
    userRole.value = res.data.user.role
  } catch (e) {
    isAuthenticated.value = false
    userRole.value = ''
    if (route.name !== 'login') {
      router.push('/login')
    }
  }
}

// Check auth on load
if (route.name !== 'print') {
  checkAuth()
}

// Provide auth state to components
provide('isAuthenticated', isAuthenticated)
provide('userRole', userRole)
provide('checkAuth', checkAuth)

const isPrintRoute = computed(() => route.name === 'print')

const logout = async () => {
  try {
    await axios.post('/api/auth/logout')
    isAuthenticated.value = false
    userRole.value = ''
    router.push('/login')
  } catch (e) {
    console.error('Logout failed', e)
  }
}
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-role {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
}
</style>
