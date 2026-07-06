import { create } from 'zustand'
import { analysisApi } from '@/services/api'

export interface Analysis {
  id: string
  user_id: string
  employability_score: number
  score_breakdown: Record<string, number>
  skills_explicit: string[]
  skills_inferred: any[]
  weaknesses: string[]
  profile_summary?: string
  experience_level?: string
  resume_profile: Record<string, any>
  github_analysis: Record<string, any>
  recruiter_feedback: Record<string, any>
  ats_report: Record<string, any>
  market_data: Record<string, any>
  recommendations: any[]
  roadmap_data: Record<string, any>
  created_at: string
}

interface AnalysisStore {
  current: Analysis | null
  history: Analysis[]
  loading: boolean
  error: string | null
  uploadResume: (fd: FormData) => Promise<void>
  fetchHistory: () => Promise<void>
  fetchById: (id: string) => Promise<void>
  whatIf: (analysis_id: string, scenarios: string[]) => Promise<any>
  clearError: () => void
  setCurrent: (a: Analysis) => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  current: null,
  history: [],
  loading: false,
  error: null,

  uploadResume: async (fd) => {
    set({ loading: true, error: null })
    try {
      const data: Analysis = await analysisApi.upload(fd)
      set((s) => ({
        current: data,
        history: [data, ...s.history.filter(h => h.id !== data.id)],
        loading: false,
      }))
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Upload failed. Check your API keys in the .env file.'
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  fetchHistory: async () => {
    try {
      const data: Analysis[] = await analysisApi.history()
      set((s) => ({
        history: data,
        // Only set current if nothing is loaded yet
        current: s.current ?? data[0] ?? null,
      }))
    } catch {
      // Silent — user may have no analyses yet
    }
  },

  fetchById: async (id) => {
    try {
      const data: Analysis = await analysisApi.get(id)
      set({ current: data })
    } catch { /* silent */ }
  },

  whatIf: async (analysis_id, scenarios) => {
    return analysisApi.whatIf(analysis_id, scenarios)
  },

  clearError: () => set({ error: null }),

  setCurrent: (a) => set({ current: a }),
}))
