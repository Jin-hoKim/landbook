import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Authorization 헤더 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('landbook_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 시 자동 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('landbook_admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
