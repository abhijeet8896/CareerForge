import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStore } from '@/store/analysisStore'
import { useAuthStore } from '@/store/authStore'
import ScoreRing from '@/components/ui/ScoreRing'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import { Upload, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

export default function OverviewPage() {
  const { current, fetchHistory } = useAnalysisStore()
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  // FIX: empty dep array is intentional — fetch once on mount
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-5 text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
          <Upload size={32} className="text-brand-400" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-semibold mb-2">Start your career analysis</h2>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Upload your resume to get a full AI-powered employability report, recruiter simulation, and personalised roadmap.
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-6 py-3 text-base" onClick={() => navigate('/upload')}>
          <Upload size={16} />Upload Resume
        </button>
      </div>
    )
  }

  const breakdown = current.score_breakdown || {}
  const radarData = Object.entries(breakdown).map(([key, val]) => ({
    axis: key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    value: Math.round(val as number),
  }))
  const barData = Object.entries(breakdown).map(([key, val]) => ({
    name: key.split('_').map(w => w[0].toUpperCase()).join(''),
    value: Math.round(val as number),
    full:  key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  }))

  const score        = current.employability_score
  const recruiterProb = Math.round((current.recruiter_feedback?.shortlist_probability ?? 0) * 100)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Career Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'there'}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/upload')}>
          <Upload size={14} />New Analysis
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card flex flex-col items-center py-4">
          <ScoreRing score={score} size={100} label="Employability" />
        </div>
        <div className="stat-card justify-center">
          <div className="stat-label">ATS Score</div>
          <div className="stat-value" style={{ color: (current.ats_report?.ats_score ?? 0) >= 70 ? '#22c55e' : '#f59e0b' }}>
            {current.ats_report?.ats_score ?? '—'}
          </div>
          <div className="stat-sub">Keyword match</div>
        </div>
        <div className="stat-card justify-center">
          <div className="stat-label">Shortlist Chance</div>
          <div className="stat-value" style={{ color: recruiterProb >= 60 ? '#22c55e' : recruiterProb >= 40 ? '#f59e0b' : '#ef4444' }}>
            {recruiterProb}%
          </div>
          <div className="stat-sub">Recruiter sim</div>
        </div>
        <div className="stat-card justify-center">
          <div className="stat-label">Skills</div>
          <div className="stat-value text-brand-400">{current.skills_explicit?.length ?? 0}</div>
          <div className="stat-sub">On resume</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {radarData.length > 0 && (
          <div className="card">
            <div className="text-white text-sm font-medium mb-4">Score Breakdown — Radar</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2d2d4a" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
        {barData.length > 0 && (
          <div className="card">
            <div className="text-white text-sm font-medium mb-4">Score Breakdown — Bars</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  contentStyle={{ background: '#1a1a26', border: '1px solid #2d2d4a', borderRadius: 8, fontSize: 13 }}
                  labelFormatter={(l) => barData.find(d => d.name === l)?.full || l}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((e, i) => (
                    <Cell key={i} fill={e.value >= 70 ? '#22c55e' : e.value >= 50 ? '#f59e0b' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(current.weaknesses?.length ?? 0) > 0 && (
          <div className="card space-y-2">
            <div className="label mb-2">Areas to Improve</div>
            {current.weaknesses.slice(0, 5).map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{w}</span>
              </div>
            ))}
          </div>
        )}
        {(current.recruiter_feedback?.strengths?.length ?? 0) > 0 && (
          <div className="card space-y-2">
            <div className="label mb-2">Your Strengths</div>
            {current.recruiter_feedback.strengths.slice(0, 5).map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {current.profile_summary && (
        <div className="card">
          <div className="label mb-2">Profile Summary</div>
          <p className="text-slate-300 text-sm leading-relaxed">{current.profile_summary}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="badge bg-brand-600/20 text-brand-400 capitalize">{current.experience_level || 'Level unknown'}</span>
            <span className="badge bg-surface-600 text-slate-400">{current.skills_explicit?.length ?? 0} skills</span>
          </div>
        </div>
      )}

      {current.recruiter_feedback?.first_impression && (
        <div className="card border-l-4 border-brand-600">
          <div className="flex items-center gap-1.5 label mb-2"><TrendingUp size={12} />Recruiter First Impression</div>
          <p className="text-slate-300 text-sm italic">"{current.recruiter_feedback.first_impression}"</p>
        </div>
      )}
    </div>
  )
}
