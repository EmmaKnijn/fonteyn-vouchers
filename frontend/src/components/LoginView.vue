<template>
  <div class="login-container">
    <div class="card login-card">
      <h2 class="login-title">Welcome Back</h2>
      <p class="login-subtitle">Sign in to manage Fonteyn Vouchers</p>
      
      <form @submit.prevent="handleLocalLogin" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" class="input" required placeholder="admin@fonteyn.local" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" class="input" required placeholder="••••••••" />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn btn-primary login-btn">Sign In</button>
      </form>
      
      <div class="divider">
        <span>OR</span>
      </div>
      
      <a href="http://vouchers.fonteyn.local/api/auth/entra" class="btn entra-btn">
        <svg class="ms-logo" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Sign in with Microsoft Entra ID
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const email = ref('')
const password = ref('')
const error = ref('')

const router = useRouter()
const checkAuth = inject('checkAuth')

const handleLocalLogin = async () => {
  error.value = ''
  try {
    await axios.post('/api/auth/login', {
      email: email.value,
      password: password.value
    })
    await checkAuth()
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login failed'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.login-subtitle {
  color: var(--text-muted);
  text-align: center;
  font-size: 0.875rem;
  margin-top: -1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.error-msg {
  color: var(--danger);
  font-size: 0.875rem;
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.divider span {
  padding: 0 0.5rem;
}

.entra-btn {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  width: 100%;
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
}

.entra-btn:hover {
  background-color: rgba(0,0,0,0.02);
}

.ms-logo {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
