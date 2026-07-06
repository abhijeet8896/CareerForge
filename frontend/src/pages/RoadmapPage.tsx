import { useEffect, useState } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import { analysisApi } from '@/services/api'
import EmptyState from '@/components/ui/EmptyState'
import { Map, CheckCircle, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const COLORS = [
  { border: 'border-brand-600', dot: 'bg-brand-600', dotBg: 'bg-brand-600/20', text: 'text-brand-400' },
  { border: 'border-teal-600',  dot: 'bg-teal-600',  dotBg: 'bg-teal-600/20',  text: 'text-teal-400'  },
  { border: 'border-amber-600', dot: 'bg-amber-600', dotBg: 'bg-amber-600/20', text: 'text-amber-400' },
  { border: 'border-green-600', dot: 'bg-green-600', dotBg: 'bg-green-600/20', text: 'text-green-400' },
]

export default function RoadmapPage() {
  const { current, fetchHistory } = useAnalysisStore()
  const [phases, setPhases]       = useState<Record<string, any> | null>(null)
  const [open, setOpen]           = useState<Record<string, boolean>>({ phase_1: true })
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchHistory()
    // Try to load from dedicated roadmap endpoint
    analysisApi.latestRoadmap()
      .then(r => { if (r?.phases) setPhases(r.phases) })
      .catch(() => setLoadError(true))
  }, [])

  // Fallback: use roadmap embedded in the analysis object
  const data: Record<string, any> | null = phases
    || (current?.roadmap_data && Object.keys(current.roadmap_data).length > 0 ? current.roadmap_data : null)

  if (!current && !data) return <EmptyState icon={<Map size={28} />} message="No roadmap yet" />

  const keys = data ? Object.keys(data).filter(k => k.startsWith('phase_')) : []
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }))

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Map size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">Learning Roadmap</h1>
          <p className="text-slate-400 text-xs mt-0.5">Your personalised 180-day employability plan</p>
        </div>
      </div>

      {!data && (
        <div className="card text-slate-400 text-sm">
          Roadmap not generated yet. Run a full analysis first.
          {loadError && <p className="text-slate-600 text-xs mt-1">Could not reach roadmap endpoint — using cached data if available.</p>}
        </div>
      )}

      {data && keys.length > 0 && (
        <>
          {/* Timeline strip */}
          <div className="card py-4">
            <div className="flex items-center">
              {keys.map((k, i) => {
                const ph  = data[k]
                const col = COLORS[i % COLORS.length]
                return (
                  <div key={k} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 gap-1 px-1">
                      <div className={clsx('w-3 h-3 rounded-full', col.dot)} />
                      <span className={clsx('text-xs font-medium text-center', col.text)}>{ph.label}</span>
                      <span className="text-slate-600 text-xs text-center hidden md:block leading-tight">
                        {(ph.focus || '').slice(0, 28)}{(ph.focus || '').length > 28 ? '…' : ''}
                      </span>
                    </div>
                    {i < keys.length - 1 && <div className="flex-1 h-px bg-surface-500" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phase accordion cards */}
          <div className="space-y-3">
            {keys.map((k, i) => {
              const ph  = data[k]
              const col = COLORS[i % COLORS.length]
              const isOpen = !!open[k]
              return (
                <div key={k} className={clsx('card border-l-4', col.border)}>
                  <button className="w-full flex items-center justify-between" onClick={() => toggle(k)}>
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', col.dotBg, col.text)}>
                        {i + 1}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">{ph.label}</div>
                        <div className="text-slate-400 text-xs">{ph.focus}</div>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />
                      : <ChevronRight size={15} className="text-slate-500 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-4 pl-11">
                      {(ph.goals || []).length > 0 && (
                        <div>
                          <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Goals</div>
                          <div className="space-y-1.5">
                            {ph.goals.map((g: string, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-sm">
                                <CheckCircle size={13} className={clsx(col.text, 'mt-0.5 flex-shrink-0')} />
                                <span className="text-slate-300">{g}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(ph.resources || []).length > 0 && (
                        <div>
                          <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Resources</div>
                          <div className="space-y-2">
                            {ph.resources.map((r: any, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-sm">
                                <BookOpen size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-white font-medium">{r.skill}</span>{' — '}
                                  {r.url
                                    ? <a href={r.url} target="_blank" rel="noopener noreferrer"
                                        className="text-brand-400 hover:underline text-xs">{r.resource}</a>
                                    : <span className="text-slate-400 text-xs">{r.resource}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {data.summary && (
            <div className="card">
              <div className="label mb-2">Summary</div>
              <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
