import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 180_000,   // 3 minutes — Ollama is slower than OpenAI on first cold start
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf_token')
      localStorage.removeItem('cf_user')
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data: {
    email: string; password: string;
    full_name?: string; target_role?: string; github_username?: string
  }) => api.post('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
}

export const analysisApi = {
  upload: (formData: FormData) =>
    api.post('/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  history: () => api.get('/analysis/history').then((r) => r.data),

  get: (id: string) => api.get(`/analysis/${id}`).then((r) => r.data),

  whatIf: (analysis_id: string, scenarios: string[]) =>
    api.post('/analysis/whatif', { analysis_id, scenarios }).then((r) => r.data),

  // FIX: correct path — must match backend route (before /{analysis_id} wildcard)
  latestRoadmap: () => api.get('/analysis/roadmap/latest').then((r) => r.data),
}

export const healthApi = {
  ollamaStatus: () =>
    api.get('/health/ollama')
      .then(r => r.data)
      .catch(() => ({ status: 'error', message: 'Backend unreachable', model_ready: false }))
}

export default api
