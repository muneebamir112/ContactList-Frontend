import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)

  async function register(name, email, password, passwordConfirmation) {
    const { data } = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  async function logout() {
    await api.post('/logout')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function fetchUser() {
    if (!token.value) return
    const { data } = await api.get('/user')
    user.value = data
  }

  const isAdmin = () => !!user.value?.is_admin

  return { token, user, isAdmin, register, login, logout, fetchUser }
})
