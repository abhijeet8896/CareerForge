import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Hammer, Loader2, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', target_role: '', github_username: ''
  })
  const [showPw, setShowPw] = useState(false)
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const onChange = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim())  { toast.error('Email is required'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    try {
      await register({
        email:           form.email.trim(),
        password:        form.password,
        full_name:       form.full_name.trim() || undefined,
        target_role:     form.target_role.trim() || undefined,
        github_username: form.github_username.trim().replace('@', '') || undefined,
      })
      toast.success('Account created! Welcome to CareerForge.')
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.'
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
          <h1 className="text-white font-semibold text-lg mb-5">Create your account</h1>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={onChange('full_name')}
                placeholder="John Doe" autoFocus />
            </div>
            <div>
              <label className="label">Email <span className="text-red-400">*</span></label>
              <input className="input" type="email" value={form.email} onChange={onChange('email')}
                placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label">Password <span className="text-red-400">*</span> <span className="text-slate-600 normal-case font-normal">(min 6 chars)</span></label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={onChange('password')}
                  placeholder="Min 6 characters" required minLength={6} autoComplete="new-password" />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Target Role</label>
              <input className="input" value={form.target_role} onChange={onChange('target_role')}
                placeholder="e.g. Frontend Developer, ML Engineer" />
            </div>
            <div>
              <label className="label">GitHub Username <span className="text-slate-600 normal-case font-normal">(for skill verification)</span></label>
              <input className="input" value={form.github_username} onChange={onChange('github_username')}
                placeholder="e.g. octocat" autoComplete="off" />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : 'Create account'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
