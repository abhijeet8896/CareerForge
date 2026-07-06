import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { Users, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'

const VERDICT: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: 'Strong Yes',  color: 'text-green-400',  bg: 'bg-green-600/20'  },
  yes:        { label: 'Yes',         color: 'text-green-400',  bg: 'bg-green-600/20'  },
  maybe:      { label: 'Maybe',       color: 'text-amber-400',  bg: 'bg-amber-600/20'  },
  no:         { label: 'No',          color: 'text-red-400',    bg: 'bg-red-600/20'    },
  strong_no:  { label: 'Strong No',   color: 'text-red-400',    bg: 'bg-red-600/20'    },
}

export default function RecruiterSimPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <EmptyState icon={<Users size={28} />} message="No recruiter simulation yet" />

  const rf = current.recruiter_feedback || {}
  const prob = Math.round((rf.shortlist_probability || 0) * 100)
  const vc = VERDICT[rf.recruiter_verdict] || { label: 'Unknown', color: 'text-slate-400', bg: 'bg-surface-600' }
  const barColor = prob >= 60 ? 'bg-green-500' : prob >= 40 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Users size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">Recruiter Simulation</h1>
          <p className="text-slate-400 text-xs mt-0.5">AI simulates a real technical recruiter reviewing your profile</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="label mb-2">Shortlist Probability</div>
          <div className={`text-4xl font-bold ${prob >= 60 ? 'text-green-400' : prob >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {prob}%
          </div>
          <div className="progress-bar h-2 mt-3">
            <div className={`progress-fill h-2 ${barColor}`} style={{ width: `${prob}%` }} />
          </div>
        </div>
        <div className="card flex flex-col justify-between">
          <div className="label">Recruiter Verdict</div>
          <div className={`text-2xl font-bold ${vc.color}`}>{vc.label}</div>
          <span className={`badge self-start ${vc.bg} ${vc.color}`}>
            {rf.recruiter_verdict?.replace('_', ' ') || '—'}
          </span>
        </div>
      </div>

      {rf.first_impression && (
        <div className="card border-l-4 border-brand-600">
          <div className="label mb-2">First Impression (6-second scan)</div>
          <p className="text-slate-300 text-sm italic leading-relaxed">"{rf.first_impression}"</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rf.rejection_reasons?.length > 0 && (
          <div className="card">
            <div className="label mb-3">Rejection Reasons</div>
            <div className="space-y-2">
              {rf.rejection_reasons.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {rf.strengths?.length > 0 && (
          <div className="card">
            <div className="label mb-3">Strengths Noted</div>
            <div className="space-y-2">
              {rf.strengths.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rf.concerns?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Hidden Concerns</div>
          <div className="space-y-2">
            {rf.concerns.map((c: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <TrendingDown size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rf.feedback && (
        <div className="card">
          <div className="label mb-2">Full Recruiter Feedback</div>
          <p className="text-slate-300 text-sm leading-relaxed">{rf.feedback}</p>
        </div>
      )}

      {rf.suggested_improvements?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Suggested Improvements</div>
          <div className="space-y-2">
            {rf.suggested_improvements.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-brand-400 font-mono text-xs mt-0.5 flex-shrink-0">{String(i+1).padStart(2,'0')}</span>
                <span className="text-slate-300">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
