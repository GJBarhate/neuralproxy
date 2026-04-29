import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(
  (config) => {
    try {
      const stored = JSON.parse(localStorage.getItem('np-store') || '{}')
      const token = stored?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      localStorage.removeItem('np-store')
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('np-store')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
