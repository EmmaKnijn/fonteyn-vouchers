<template>
  <div class="print-container">
    <div class="actions no-print">
      <button @click="window.print()" class="btn btn-primary">Print Now</button>
      <button @click="$router.push('/')" class="btn">Back to Dashboard</button>
    </div>

    <!-- We chunk the vouchers into pages of 6 -->
    <div v-for="(page, pageIndex) in paginatedVouchers" :key="pageIndex" class="a4-page">
      <div class="vouchers-grid">
        <div v-for="v in page" :key="v.voucher" class="voucher-card">
          <div class="voucher-header">
            <!-- Placeholder Logo -->
            <div class="logo-placeholder">
              <span>FHP</span>
            </div>
            <div class="header-text">
              <h2>Fonteyn Holiday Parks</h2>
              <p class="location">{{ v.location || 'Main Resort' }}</p>
            </div>
          </div>
          
          <div class="voucher-body">
            <div class="guest-info">
              <span class="label">Guest Name:</span>
              <span class="value">{{ v.guest_name }}</span>
            </div>
            
            <div class="voucher-code-box">
              <span class="label">Wi-Fi Access Code:</span>
              <span class="code">{{ v.voucher }}</span>
            </div>
            
            <div class="open-text" v-if="v.open_text">
              {{ v.open_text }}
            </div>
          </div>
          
          <div class="voucher-footer">
            <div class="qr-section">
              <qrcode-vue :value="`http://wifi.fonteyn.local/activate?code=${v.voucher}`" :size="80" level="M" />
              <span class="qr-text">Scan to Connect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import QrcodeVue from 'qrcode.vue'

const vouchers = ref([])

const window = globalThis.window

const fetchVouchers = async () => {
  try {
    const res = await axios.get('/api/vouchers')
    vouchers.value = res.data
  } catch (e) {
    console.error('Failed to fetch vouchers for print', e)
  }
}

const paginatedVouchers = computed(() => {
  const pages = []
  for (let i = 0; i < vouchers.value.length; i += 6) {
    pages.push(vouchers.value.slice(i, i + 6))
  }
  return pages
})

onMounted(() => {
  fetchVouchers()
})
</script>

<style scoped>
.print-container {
  background: #525659;
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.a4-page {
  width: 210mm;
  height: 297mm;
  background: white;
  padding: 15mm;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  box-sizing: border-box;
}

.vouchers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 10mm;
  height: 100%;
}

.voucher-card {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 4mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.voucher-header {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.logo-placeholder {
  width: 40px;
  height: 40px;
  background: #4F46E5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: bold;
}

.header-text h2 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.header-text .location {
  margin: 0;
  font-size: 10px;
  color: #666;
}

.voucher-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.label {
  font-size: 10px;
  color: #666;
  display: block;
}

.value {
  font-size: 14px;
  font-weight: bold;
  color: #111;
}

.voucher-code-box {
  background: #f9f9f9;
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
  border-radius: 4px;
}

.voucher-code-box .code {
  display: block;
  font-size: 20px;
  font-family: monospace;
  font-weight: bold;
  color: #4F46E5;
  letter-spacing: 2px;
}

.open-text {
  font-size: 10px;
  color: #444;
  font-style: italic;
  border-left: 2px solid #ccc;
  padding-left: 5px;
}

.voucher-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.qr-text {
  font-size: 10px;
  font-weight: bold;
  color: #333;
}

@media print {
  @page {
    size: A4;
    margin: 0;
  }
  
  body, html {
    margin: 0;
    padding: 0;
    background: white;
  }

  .print-container {
    background: none;
    padding: 0;
    display: block;
  }

  .no-print {
    display: none !important;
  }

  .a4-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
  }
}
</style>
