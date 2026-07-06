import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { Target, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'

export default function ATSPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <EmptyState icon={<Target size={28} />} message="No ATS analysis yet" />

  const ats = current.ats_report || {}
  const score = ats.ats_score ?? 0
  const scoreColor = score >= 70 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const barColor  = score >= 70 ? 'bg-green-500'  : score >= 50 ? 'bg-amber-500'  : 'bg-red-500'

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Target size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">ATS Optimization</h1>
          <p className="text-slate-400 text-xs mt-0.5">Keyword matching, formatting fixes and rewrite suggestions</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="label mb-1">ATS Compatibility Score</div>
            <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
            <div className="text-slate-500 text-xs mt-1">out of 100</div>
          </div>
          <div className="text-right">
            <div className="label mb-1">Keywords Matched</div>
            <div className="text-white text-2xl font-bold">
              {ats.keyword_matches?.length ?? 0}
              <span className="text-slate-500 text-base font-normal">
                /{(ats.keyword_matches?.length ?? 0) + (ats.missing_keywords?.length ?? 0)}
              </span>
            </div>
          </div>
        </div>
        <div className="progress-bar h-2.5">
          <div className={`progress-fill h-2.5 ${barColor}`} style={{ width: `${score}%` }} />
        </div>
        {ats.overall_verdict && (
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">{ats.overall_verdict}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ats.keyword_matches?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 label mb-3">
              <CheckCircle size={13} className="text-green-400" />Matched Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ats.keyword_matches.map((k: string) => (
                <span key={k} className="badge bg-green-600/20 text-green-400">{k}</span>
              ))}
            </div>
          </div>
        )}
        {ats.missing_keywords?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 label mb-3">
              <XCircle size={13} className="text-red-400" />Missing Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ats.missing_keywords.map((k: string) => (
                <span key={k} className="badge bg-red-600/20 text-red-400">{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {ats.formatting_issues?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 label mb-3">
            <AlertTriangle size={13} className="text-amber-400" />Formatting Issues
          </div>
          <div className="space-y-1.5">
            {ats.formatting_issues.map((issue: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-400 flex-shrink-0">•</span>
                <span className="text-slate-300">{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ats.rewrite_suggestions?.length > 0 && (
        <div className="card">
          <div className="label mb-4">Bullet Rewrite Suggestions</div>
          <div className="space-y-5">
            {ats.rewrite_suggestions.map((s: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <XCircle size={12} className="text-red-400 mt-1 flex-shrink-0" />
                  <p className="text-red-400/70 text-sm line-through leading-relaxed">{s.original}</p>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight size={12} className="text-green-400 mt-1 flex-shrink-0" />
                  <p className="text-green-400 text-sm leading-relaxed">{s.improved}</p>
                </div>
                {s.reason && <p className="ml-5 text-slate-500 text-xs italic">{s.reason}</p>}
                {i < ats.rewrite_suggestions.length - 1 && <div className="divider pt-2" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
