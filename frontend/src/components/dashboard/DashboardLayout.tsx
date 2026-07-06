import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAnalysisStore } from '@/store/analysisStore'
import { healthApi } from '@/services/api'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  LayoutDashboard, Upload, FileText, Github, Users,
  TrendingUp, Lightbulb, Map, Target, Zap, LogOut, Hammer,
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview',      end: true  },
  { to: '/upload',    icon: Upload,          label: 'Upload Resume', end: false },
  { to: '/resume',    icon: FileText,        label: 'Resume Intel',  end: false },
  { to: '/github',    icon: Github,          label: 'GitHub Intel',  end: false },
  { to: '/recruiter', icon: Users,           label: 'Recruiter Sim', end: false },
  { to: '/market',    icon: TrendingUp,      label: 'Market Demand', end: false },
  { to: '/projects',  icon: Lightbulb,       label: 'Projects',      end: false },
  { to: '/roadmap',   icon: Map,             label: 'Roadmap',       end: false },
  { to: '/ats',       icon: Target,          label: 'ATS Score',     end: false },
  { to: '/whatif',    icon: Zap,             label: 'What-If',       end: false },
]

interface OllamaStatus {
  status: 'ok' | 'error' | 'checking'
  model_ready?: boolean
  model?: string
  message?: string
}

export default function DashboardLayout() {
  const { user, logout }    = useAuthStore()
  const { current }         = useAnalysisStore()
  const navigate            = useNavigate()
  const [ollama, setOllama] = useState<OllamaStatus>({ status: 'checking' })

  const handleLogout = () => { logout(); navigate('/login') }

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-green-400' : s >= 50 ? 'text-amber-400' : 'text-red-400'

  // Poll Ollama status on mount and every 30 seconds
  useEffect(() => {
    const check = async () => {
      const data = await healthApi.ollamaStatus()
      setOllama(data)
    }
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])

  const ollamaDot = ollama.status === 'checking'
    ? 'bg-slate-500'
    : ollama.status === 'ok' && ollama.model_ready
    ? 'bg-green-400'
    : ollama.status === 'ok' && !ollama.model_ready
    ? 'bg-yellow-400'
    : 'bg-red-400'

  const ollamaLabel = ollama.status === 'checking'
    ? 'Checking Ollama…'
    : ollama.status === 'ok' && ollama.model_ready
    ? ollama.model || 'Model ready'
    : ollama.status === 'ok' && !ollama.model_ready
    ? 'Model not pulled'
    : 'Ollama offline'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-800 border-r border-surface-600">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-surface-600">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-600/50">
            <Hammer size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm tracking-wide">CareerForge</div>
            <div className="text-slate-500 text-xs">AI Copilot</div>
          </div>
        </div>

        {/* Employability score pill */}
        {current && (
          <div className="mx-3 mt-3 px-3 py-2 bg-surface-700 rounded-lg border border-surface-600">
            <div className="text-slate-500 text-xs uppercase tracking-wide">Employability</div>
            <div className={`text-xl font-bold ${scoreColor(current.employability_score)}`}>
              {Math.round(current.employability_score)}<span className="text-slate-600 text-sm font-normal">/100</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 mt-2">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                clsx('nav-link', isActive && 'nav-link-active')
              }>
              <Icon size={15} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Ollama status indicator */}
        <div className="px-3 py-2 border-t border-surface-600">
          <div className="flex items-center gap-2 px-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ollamaDot} ${ollama.status === 'checking' ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-slate-500 truncate" title={ollamaLabel}>{ollamaLabel}</span>
          </div>
        </div>

        {/* User footer */}
        <div className="p-2 border-t border-surface-600">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate">{user?.full_name || user?.email}</div>
              <div className="text-xs text-slate-500 truncate">{user?.target_role || 'No role set'}</div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-surface-900">
        <Outlet />
      </main>
    </div>
  )
}
