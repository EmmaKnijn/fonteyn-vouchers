<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="card modal-content">
      <h2 class="modal-title">Create Voucher</h2>
      <p class="modal-subtitle">Generate a new captive portal voucher for a guest.</p>
      
      <form @submit.prevent="submit" class="voucher-form">
        <div class="form-group">
          <label>Guest Name *</label>
          <input v-model="guest_name" type="text" class="input" required placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label>Location / Room</label>
          <input v-model="location" type="text" class="input" placeholder="Cabin 42" />
        </div>
        <div class="form-group">
          <label>Additional Notes</label>
          <textarea v-model="open_text" class="input textarea" placeholder="Any extra information..."></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close', 'created'])

const guest_name = ref('')
const location = ref('')
const open_text = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    await axios.post('/api/vouchers', {
      guest_name: guest_name.value,
      location: location.value,
      open_text: open_text.value
    })
    emit('created')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create voucher'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.modal-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.voucher-form {
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

.textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.error-msg {
  color: var(--danger);
  font-size: 0.875rem;
  text-align: right;
}
</style>
