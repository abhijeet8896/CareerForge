import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Hammer, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const { login, loading }      = useAuthStore()
  const navigate                = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Email is required'); return }
    if (!password)     { toast.error('Password is required'); return }
    try {
      await login(email.trim(), password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Hammer size={22} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-xl">CareerForge</div>
            <div className="text-slate-400 text-xs">AI Employability Copilot</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-white font-semibold text-lg mb-5">Sign in to your account</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password" />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" />Signing in…</> : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Powered by GPT-4o-mini · LangGraph · FastAPI
        </p>
      </div>
    </div>
  )
}
