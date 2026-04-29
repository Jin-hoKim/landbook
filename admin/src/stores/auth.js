import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('landbook_admin_token') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(password) {
    const { data } = await api.post('/auth/login', { password })
    token.value = data.token
    localStorage.setItem('landbook_admin_token', data.token)
    return data
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('landbook_admin_token')
  }

  return { token, isLoggedIn, login, logout }
})
