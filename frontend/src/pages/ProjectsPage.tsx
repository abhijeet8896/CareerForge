import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { Lightbulb, Clock, Zap, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const DIFF: Record<string, string> = {
  beginner: 'bg-green-600/20 text-green-400',
  intermediate: 'bg-amber-600/20 text-amber-400',
  advanced: 'bg-red-600/20 text-red-400',
}
const VAL: Record<string, string> = {
  high: 'bg-brand-600/20 text-brand-400',
  medium: 'bg-teal-600/20 text-teal-400',
  low: 'bg-surface-600 text-slate-400',
}

export default function ProjectsPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <EmptyState icon={<Lightbulb size={28} />} message="No project recommendations yet" />

  const projects = current.recommendations || []

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Lightbulb size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">Recommended Projects</h1>
          <p className="text-slate-400 text-xs mt-0.5">AI-curated portfolio projects to maximise employability</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card text-slate-400 text-sm">No project recommendations. Run a full analysis first.</div>
      ) : (
        <div className="space-y-5">
          {projects.map((p: any, i: number) => (
            <div key={i} className="card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-400 font-mono text-xs">{String(i+1).padStart(2,'0')}</span>
                    <h2 className="text-white font-semibold">{p.title}</h2>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={clsx('badge', VAL[p.portfolio_value] || VAL.medium)}>{p.portfolio_value} value</span>
                  <span className={clsx('badge', DIFF[p.difficulty] || DIFF.intermediate)}>{p.difficulty}</span>
                </div>
              </div>

              {p.tech_stack?.length > 0 && (
                <div>
                  <div className="text-slate-500 text-xs mb-1.5 uppercase tracking-wide">Tech Stack</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech_stack.map((t: string) => <span key={t} className="badge bg-surface-600 text-slate-300">{t}</span>)}
                  </div>
                </div>
              )}

              {p.skills_learned?.length > 0 && (
                <div>
                  <div className="text-slate-500 text-xs mb-1.5 uppercase tracking-wide">Skills You'll Learn</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills_learned.map((s: string) => <span key={s} className="badge bg-teal-600/15 text-teal-400">{s}</span>)}
                  </div>
                </div>
              )}

              {p.why_recommended && (
                <div className="flex items-start gap-2 bg-brand-600/10 border border-brand-600/20 rounded-lg px-3 py-2">
                  <Zap size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <p className="text-brand-300 text-xs leading-relaxed">{p.why_recommended}</p>
                </div>
              )}

              {p.milestones?.length > 0 && (
                <div>
                  <div className="text-slate-500 text-xs mb-2 uppercase tracking-wide">Milestones</div>
                  <div className="space-y-1.5">
                    {p.milestones.map((m: string, j: number) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={13} className="text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-400">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-surface-600">
                <Clock size={11} />~{p.estimated_hours}h estimated
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
