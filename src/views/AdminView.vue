<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const auth = useAuthStore()
const router = useRouter()

const logs = ref([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(15)

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

const pageNumbers = computed(() => {
  const range = []
  const delta = 2
  const left = Math.max(1, currentPage.value - delta)
  const right = Math.min(lastPage.value, currentPage.value + delta)
  for (let i = left; i <= right; i++) range.push(i)
  return range
})

const from = computed(() => (currentPage.value - 1) * perPage.value + 1)
const to = computed(() => Math.min(currentPage.value * perPage.value, total.value))

async function fetchLogs(page = 1) {
  loading.value = true
  const { data } = await api.get('/admin/logs', { params: { page } })
  logs.value = data.data
  currentPage.value = data.current_page
  lastPage.value = data.last_page
  total.value = data.total
  perPage.value = data.per_page
  loading.value = false
}

function goToPage(page) {
  if (page < 1 || page > lastPage.value) return
  fetchLogs(page)
}

function formatDate(date) {
  return new Date(date).toLocaleString()
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => fetchLogs(1))
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
            to="/admin"
            class="text-sm px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium transition"
          >
            Admin Panel
          </RouterLink>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
        <span class="text-sm text-gray-500">{{ auth.user?.name }}</span>
        <button @click="logout" class="text-sm text-red-500 hover:text-red-700 font-medium transition">
          Logout
        </button>
      </div>
    </nav>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-700">All Activity Logs</h2>
        <span v-if="!loading" class="text-xs text-gray-400">{{ total }} total entries</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Loading…</div>

      <div v-else-if="logs.length === 0" class="text-center text-gray-400 py-16">
        <p class="text-sm">No activity recorded yet.</p>
      </div>

      <template v-else>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP Address</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50 transition">
                <td class="px-5 py-3">
                  <p class="font-medium text-gray-800">{{ log.user?.name }}</p>
                  <p class="text-xs text-gray-400">{{ log.user?.email }}</p>
                </td>
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

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4">
          <p class="text-xs text-gray-400">
            Showing {{ from }}–{{ to }} of {{ total }} results
          </p>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            <button
              v-for="page in pageNumbers"
              :key="page"
              @click="goToPage(page)"
              class="px-3 py-1.5 text-xs rounded-lg border transition"
              :class="page === currentPage
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
            >
              {{ page }}
            </button>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === lastPage"
              class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
