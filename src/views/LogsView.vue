<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const auth = useAuthStore()
const router = useRouter()

const logs = ref([])
const loading = ref(true)

const actionLabels = {
  login: 'Logged in',
  logout: 'Logged out',
  register: 'Registered',
  contact_created: 'Created contact',
  contact_updated: 'Updated contact',
  contact_deleted: 'Deleted contact',
}

const actionColors = {
  login: 'bg-green-100 text-green-700',
  logout: 'bg-gray-100 text-gray-600',
  register: 'bg-blue-100 text-blue-700',
  contact_created: 'bg-indigo-100 text-indigo-700',
  contact_updated: 'bg-yellow-100 text-yellow-700',
  contact_deleted: 'bg-red-100 text-red-700',
}

async function fetchLogs() {
  loading.value = true
  const { data } = await api.get('/logs')
  logs.value = data.data
  loading.value = false
}

function formatDate(date) {
  return new Date(date).toLocaleString()
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(fetchLogs)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-bold text-gray-800">Contact List</h1>
        <div class="flex gap-1">
          <RouterLink
            to="/contacts"
            class="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
          >
            Contacts
          </RouterLink>
          <RouterLink
            to="/logs"
            class="text-sm px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium transition"
          >
            Logs
          </RouterLink>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ auth.user?.name }}</span>
        <button
          @click="logout"
          class="text-sm text-red-500 hover:text-red-700 font-medium transition"
        >
          Logout
        </button>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <h2 class="text-base font-semibold text-gray-700 mb-4">Activity Log</h2>

      <div v-if="loading" class="text-center text-gray-400 py-16">Loading…</div>

      <div v-else-if="logs.length === 0" class="text-center text-gray-400 py-16">
        <p class="text-sm">No activity recorded yet.</p>
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP Address</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="actionColors[log.action] || 'bg-gray-100 text-gray-600'"
                >
                  {{ actionLabels[log.action] || log.action }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-700">{{ log.description }}</td>
              <td class="px-5 py-3 text-gray-400">{{ log.ip_address || '—' }}</td>
              <td class="px-5 py-3 text-gray-400">{{ formatDate(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
