import { useEffect, useState } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import ScoreRing from '@/components/ui/ScoreRing'
import { Zap, Plus, X, TrendingUp, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESETS = [
  'Learn React', 'Learn TypeScript', 'Add Docker', 'Learn AWS',
  'Build 2 projects', 'Optimise ATS', 'Contribute to open source',
  'Learn System Design', 'Get AWS certified', 'Practice DSA',
  'Learn PostgreSQL', 'Add CI/CD pipeline', 'Learn Next.js',
]

export default function WhatIfPage() {
  const { current, fetchHistory, whatIf } = useAnalysisStore()
  const [scenarios, setScenarios] = useState(['Learn React', 'Build 2 projects', 'Optimise ATS'])
  const [input, setInput]         = useState('')
  const [result, setResult]       = useState<any>(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return <EmptyState icon={<Zap size={28} />} message="No analysis found" />

  const add = (s: string) => {
    const v = s.trim()
    if (!v) return
    if (scenarios.includes(v)) { toast.error('Already added'); return }
    if (scenarios.length >= 8) { toast.error('Max 8 scenarios'); return }
    setScenarios(p => [...p, v])
    setInput('')
  }
  const remove = (i: number) => setScenarios(p => p.filter((_, j) => j !== i))

  const run = async () => {
    if (!scenarios.length) { toast.error('Add at least one scenario'); return }
    setLoading(true)
    try {
      const data = await whatIf(current.id, scenarios)
      setResult(data)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const best = result?.scenarios?.reduce(
    (b: any, s: any) => s.score_delta > (b?.score_delta ?? -Infinity) ? s : b, null
  )

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Zap size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">What-If Simulator</h1>
          <p className="text-slate-400 text-xs mt-0.5">Project how specific actions improve your employability score</p>
        </div>
      </div>

      {/* Current score */}
      <div className="card flex items-center gap-6">
        <ScoreRing score={current.employability_score} size={90} label="Current" />
        <div>
          <div className="label mb-1">Current Employability Score</div>
          <div className="text-white text-3xl font-bold">{current.employability_score}</div>
          <div className="text-slate-500 text-xs mt-1">Add scenarios below to see projected improvement</div>
        </div>
      </div>

      {/* Builder */}
      <div className="card space-y-4">
        <div className="label">Your Scenarios <span className="text-slate-600 normal-case font-normal">({scenarios.length}/8)</span></div>

        {scenarios.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s, i) => (
              <div key={i} className="flex items-center gap-1 badge bg-brand-600/20 text-brand-400 pr-1.5">
                {s}
                <button onClick={() => remove(i)} className="ml-1 hover:text-red-400 transition-colors" aria-label="Remove">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No scenarios yet — add from presets or type your own.</p>
        )}

        <div className="flex gap-2">
          <input className="input" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input) } }}
            placeholder="Type a custom scenario and press Enter…" />
          <button onClick={() => add(input)} className="btn-secondary flex items-center gap-1 flex-shrink-0">
            <Plus size={15} />Add
          </button>
        </div>

        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Quick Add</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.filter(s => !scenarios.includes(s)).map(s => (
              <button key={s} onClick={() => add(s)}
                className="badge bg-surface-600 text-slate-400 hover:bg-surface-500 hover:text-white transition-colors cursor-pointer">
                + {s}
              </button>
            ))}
          </div>
        </div>

        <button onClick={run} disabled={loading || !scenarios.length}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          <Zap size={14} />
          {loading ? 'Simulating…' : 'Run Simulation'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Best pick highlight */}
          {best && (
            <div className="card border border-brand-600/40 bg-brand-600/5">
              <div className="flex items-center gap-1.5 label mb-2 text-brand-400">
                <TrendingUp size={12} />Best Opportunity
              </div>
              <div className="text-white font-semibold">{best.scenario}</div>
              <div className="text-slate-400 text-sm mt-0.5">
                Projected score:{' '}
                <span className="text-green-400 font-bold text-lg">{best.projected_score}</span>
                <span className="text-slate-500 text-xs ml-2">(+{best.score_delta} pts)</span>
              </div>
            </div>
          )}

          {/* Cumulative bar chart */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <div className="label">Cumulative Scenario Results</div>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Info size={11} />Scores are cumulative
              </div>
            </div>

            {result.scenarios?.map((s: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{s.scenario}</span>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-green-400 font-mono text-xs bg-green-400/10 px-1.5 py-0.5 rounded">+{s.score_delta}</span>
                    <span className="text-white font-bold w-8 text-right">{s.projected_score}</span>
                  </div>
                </div>
                <div className="relative h-2 bg-surface-600 rounded-full overflow-hidden">
                  {/* Baseline */}
                  <div className="absolute top-0 left-0 h-full rounded-full bg-surface-400"
                    style={{ width: `${result.current_score}%` }} />
                  {/* Projected */}
                  <div className="absolute top-0 left-0 h-full rounded-full bg-brand-500 opacity-70 transition-all duration-700"
                    style={{ width: `${s.projected_score}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Baseline {result.current_score}</span>
                  <span className="text-brand-400">→ {s.projected_score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Score ring comparison */}
          {result.scenarios?.length >= 2 && (
            <div className="card">
              <div className="label mb-4">Score Comparison</div>
              <div className="flex items-center justify-around flex-wrap gap-4">
                <ScoreRing score={result.current_score} size={80} label="Now" />
                {result.scenarios.slice(0, 4).map((s: any, i: number) => (
                  <ScoreRing key={i} score={s.projected_score} size={80}
                    label={s.scenario.length > 12 ? s.scenario.slice(0, 12) + '…' : s.scenario} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
