import { create } from 'zustand'
import { authApi } from '@/services/api'

export interface User {
  id: string
  email: string
  full_name?: string
  target_role?: string
  github_username?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  loading: boolean
  init: () => void
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string; password: string;
    full_name?: string; target_role?: string; github_username?: string
  }) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,

  init: () => {
    try {
      const token = localStorage.getItem('cf_token')
      const raw   = localStorage.getItem('cf_user')
      if (token && raw) set({ token, user: JSON.parse(raw) })
    } catch {
      // Corrupt storage — clear it
      localStorage.removeItem('cf_token')
      localStorage.removeItem('cf_user')
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('cf_token', data.access_token)
      localStorage.setItem('cf_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  register: async (payload) => {
    set({ loading: true })
    try {
      const data = await authApi.register(payload)
      localStorage.setItem('cf_token', data.access_token)
      localStorage.setItem('cf_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    set({ user: null, token: null })
  },
}))
