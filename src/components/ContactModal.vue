<script setup>
import { ref, watch } from 'vue'
import api from '../api/axios'

const props = defineProps({
  contact: { type: Object, default: null },
})
const emit = defineEmits(['saved', 'close'])

const form = ref({ name: '', email: '', phone: '', address: '' })
const error = ref('')
const loading = ref(false)

watch(
  () => props.contact,
  (val) => {
    form.value = val
      ? { name: val.name, email: val.email || '', phone: val.phone || '', address: val.address || '' }
      : { name: '', email: '', phone: '', address: '' }
  },
  { immediate: true },
)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const isEdit = !!props.contact
    const url = isEdit ? `/contacts/${props.contact.id}` : '/contacts'
    const method = isEdit ? 'put' : 'post'
    const { data } = await api[method](url, form.value)
    emit('saved', data)
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors) {
      error.value = Object.values(errors).flat().join(' ')
    } else {
      error.value = e.response?.data?.message || 'Something went wrong.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <h2 class="text-lg font-bold text-gray-800 mb-5">
        {{ contact ? 'Edit contact' : 'New contact' }}
      </h2>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Full name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            v-model="form.address"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="123 Main St"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {{ loading ? 'Saving…' : (contact ? 'Save changes' : 'Add contact') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
