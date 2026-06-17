<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'
import ContactModal from '../components/ContactModal.vue'

const auth = useAuthStore()
const router = useRouter()

const contacts = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const editingContact = ref(null)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(10)

const filtered = () =>
  contacts.value.filter(
    (c) =>
      c.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.value.toLowerCase())) ||
      (c.phone && c.phone.includes(search.value)),
  )

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

async function fetchContacts(page = 1) {
  loading.value = true
  const { data } = await api.get('/contacts', { params: { page } })
  contacts.value = data.data
  currentPage.value = data.current_page
  lastPage.value = data.last_page
  total.value = data.total
  perPage.value = data.per_page
  loading.value = false
}

function goToPage(page) {
  if (page < 1 || page > lastPage.value) return
  search.value = ''
  fetchContacts(page)
}

function openAdd() {
  editingContact.value = null
  showModal.value = true
}

function openEdit(contact) {
  editingContact.value = { ...contact }
  showModal.value = true
}

async function deleteContact(id) {
  if (!confirm('Delete this contact?')) return
  await api.delete('/contacts/' + id)
  const page = contacts.value.length === 1 && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
  fetchContacts(page)
}

function onSaved() {
  showModal.value = false
  fetchContacts(currentPage.value)
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => fetchContacts(1))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-bold text-gray-800">Contact List</h1>
        <div class="flex gap-1">
          <RouterLink
            to="/contacts"
            class="text-sm px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium transition"
          >
            Contacts
          </RouterLink>
          <RouterLink
            v-if="auth.isAdmin()"
            to="/admin"
            class="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
          >
            Admin Panel
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

    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex gap-3 mb-6">
        <input
          v-model="search"
          type="text"
          placeholder="Search contacts…"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          @click="openAdd"
          class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add
        </button>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Loading…</div>

      <div v-else-if="filtered().length === 0" class="text-center text-gray-400 py-16">
        <p class="text-4xl mb-3">📋</p>
        <p class="text-sm">{{ search ? 'No contacts match your search.' : 'No contacts yet. Add your first one!' }}</p>
      </div>

      <div v-else>
        <ul class="space-y-3">
          <li
            v-for="contact in filtered()"
            :key="contact.id"
            class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm select-none">
                {{ contact.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-medium text-gray-800 text-sm">{{ contact.name }}</p>
                <p v-if="contact.email" class="text-gray-500 text-xs">{{ contact.email }}</p>
                <p v-if="contact.phone" class="text-gray-400 text-xs">{{ contact.phone }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="openEdit(contact)"
                class="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition"
              >
                Edit
              </button>
              <button
                @click="deleteContact(contact.id)"
                class="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>

        <div v-if="lastPage > 1" class="flex items-center justify-between mt-4">
          <p class="text-xs text-gray-400">Showing {{ from }}–{{ to }} of {{ total }} contacts</p>
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
              :class="page === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
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
      </div>
    </div>

    <ContactModal
      v-if="showModal"
      :contact="editingContact"
      @saved="onSaved"
      @close="showModal = false"
    />
  </div>
</template>
