<script setup>
import { ref, onMounted } from 'vue'
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

const filtered = () =>
  contacts.value.filter(
    (c) =>
      c.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.value.toLowerCase())) ||
      (c.phone && c.phone.includes(search.value)),
  )

async function fetchContacts() {
  loading.value = true
  const { data } = await api.get('/contacts')
  contacts.value = data
  loading.value = false
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
  await api.delete(`/contacts/${id}`)
  contacts.value = contacts.value.filter((c) => c.id !== id)
}

function onSaved(contact) {
  const idx = contacts.value.findIndex((c) => c.id === contact.id)
  if (idx !== -1) {
    contacts.value[idx] = contact
  } else {
    contacts.value.push(contact)
    contacts.value.sort((a, b) => a.name.localeCompare(b.name))
  }
  showModal.value = false
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(fetchContacts)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 class="text-lg font-bold text-gray-800">Contacts</h1>
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
      <!-- Search + Add -->
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

      <!-- Loading -->
      <div v-if="loading" class="text-center text-gray-400 py-16">Loading…</div>

      <!-- Empty -->
      <div
        v-else-if="filtered().length === 0"
        class="text-center text-gray-400 py-16"
      >
        <p class="text-4xl mb-3">📋</p>
        <p class="text-sm">{{ search ? 'No contacts match your search.' : 'No contacts yet. Add your first one!' }}</p>
      </div>

      <!-- Contact list -->
      <ul v-else class="space-y-3">
        <li
          v-for="contact in filtered()"
          :key="contact.id"
          class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm select-none"
            >
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
    </div>

    <!-- Modal -->
    <ContactModal
      v-if="showModal"
      :contact="editingContact"
      @saved="onSaved"
      @close="showModal = false"
    />
  </div>
</template>
