<template>
  <div class="voucher-dashboard">
    <div class="dashboard-header">
      <div>
        <h2 class="title">Vouchers</h2>
        <p class="subtitle">Manage captive portal access</p>
      </div>
      <div class="actions">
        <button v-if="canEdit" @click="showCreateModal = true" class="btn btn-primary">
          + New Voucher
        </button>
        <button @click="printAll" class="btn">
          Print A4 Layout
        </button>
      </div>
    </div>

    <div class="card table-container">
      <table v-if="vouchers.length > 0">
        <thead>
          <tr>
            <th>Guest Name</th>
            <th>Location</th>
            <th>Voucher Code</th>
            <th>Roll</th>
            <th>Status</th>
            <th>Expires</th>
            <th v-if="canEdit">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vouchers" :key="v.voucher">
            <td>{{ v.guest_name }}</td>
            <td>{{ v.location }}</td>
            <td><code>{{ v.voucher }}</code></td>
            <td>{{ v.roll }}</td>
            <td>
              <span :class="['status-badge', v.activated ? 'active' : 'inactive']">
                {{ v.activated ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ v.expires || '24 Hours' }}</td>
            <td v-if="canEdit" class="action-buttons">
              <button @click="toggleVoucher(v.voucher)" class="btn btn-sm" :class="v.activated ? 'btn-danger' : 'btn-primary'">
                {{ v.activated ? 'Disable' : 'Enable' }}
              </button>
              <button @click="deleteVoucher(v.voucher)" class="btn btn-danger btn-sm">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        No vouchers found.
      </div>
    </div>

    <CreateVoucherModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
      @created="onVoucherCreated" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import CreateVoucherModal from './CreateVoucherModal.vue'

const router = useRouter()
const userRole = inject('userRole')
const canEdit = computed(() => userRole.value === 'admin' || userRole.value === 'editor')

const vouchers = ref([])
const showCreateModal = ref(false)

const fetchVouchers = async () => {
  try {
    const res = await axios.get('/api/vouchers')
    vouchers.value = res.data
  } catch (e) {
    console.error('Failed to fetch vouchers', e)
  }
}

const deleteVoucher = async (id) => {
  if (!confirm('Are you sure you want to delete this voucher?')) return
  try {
    await axios.delete(`/api/vouchers/${id}`)
    await fetchVouchers()
  } catch (e) {
    console.error('Failed to delete', e)
  }
}

const toggleVoucher = async (id) => {
  try {
    await axios.patch(`/api/vouchers/${id}/toggle`)
    await fetchVouchers()
  } catch (e) {
    console.error('Failed to toggle', e)
  }
}

const onVoucherCreated = () => {
  showCreateModal.value = false
  fetchVouchers()
}

const printAll = () => {
  // Store the data temporarily in sessionStorage or just rely on the print route fetching it
  router.push('/print')
}

onMounted(() => {
  fetchVouchers()
})
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.active {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-badge.inactive {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-style: italic;
}

code {
  background-color: rgba(0,0,0,0.05);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

@media (prefers-color-scheme: dark) {
  code {
    background-color: rgba(255,255,255,0.1);
  }
}
</style>
