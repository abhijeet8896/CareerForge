import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { TrendingUp, TrendingDown, Wifi, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function MarketPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <EmptyState icon={<TrendingUp size={28} />} message="No market analysis yet" />

  const md = current.market_data || {}
  const trending = md.trending_skills || []
  const salary = md.salary_range
  const chartData = trending.map((s: any) => ({ name: s.skill, demand: s.demand, trend: s.trend }))

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <TrendingUp size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">Market Intelligence</h1>
          <p className="text-slate-400 text-xs mt-0.5">Real-world demand for your target role</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-label">Demand Score</div>
          <div className="stat-value text-brand-400">{md.demand_score ?? '—'}</div>
          <div className="stat-sub">out of 100</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1 stat-label"><Wifi size={11} />Remote</div>
          <div className={`stat-value ${md.remote_opportunities === 'high' ? 'text-green-400' : md.remote_opportunities === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
            {md.remote_opportunities ? md.remote_opportunities.charAt(0).toUpperCase() + md.remote_opportunities.slice(1) : '—'}
          </div>
        </div>
        {salary && (
          <div className="stat-card col-span-2">
            <div className="stat-label">Salary Range (est.)</div>
            <div className="stat-value text-green-400">
              {salary.currency} {(salary.min/100000).toFixed(1)}L – {(salary.max/100000).toFixed(1)}L
            </div>
            <div className="stat-sub">Per annum</div>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="text-white text-sm font-medium mb-4">Skill Market Demand</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={26}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                contentStyle={{ background: '#1a1a26', border: '1px solid #2d2d4a', borderRadius: 8, fontSize: 13 }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
                {chartData.map((e: any, i: number) => (
                  <Cell key={i} fill={e.trend === 'rising' ? '#6366f1' : e.trend === 'stable' ? '#14b8a6' : '#475569'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            {[['#6366f1','Rising'],['#14b8a6','Stable'],['#475569','Declining']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="card">
          <div className="label mb-4">Trending Skills — Detail</div>
          <div className="space-y-4">
            {trending.map((s: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.trend === 'rising'
                      ? <TrendingUp size={13} className="text-green-400" />
                      : <TrendingDown size={13} className="text-red-400" />}
                    <span className="text-white text-sm font-medium">{s.skill}</span>
                    <span className={`badge text-xs ${s.trend === 'rising' ? 'bg-green-600/20 text-green-400' : 'bg-slate-600/30 text-slate-400'}`}>{s.trend}</span>
                  </div>
                  <span className="text-brand-400 font-mono text-sm">{s.demand}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div className="progress-fill h-1.5 bg-brand-600" style={{ width: `${s.demand}%` }} />
                </div>
                {s.rationale && <p className="text-slate-500 text-xs leading-relaxed">{s.rationale}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {md.declining_skills?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Declining Skills — Avoid Over-Investing</div>
          <div className="space-y-2">
            {md.declining_skills.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <TrendingDown size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-medium">{s.skill}</span>
                  {s.rationale && <p className="text-slate-500 text-xs mt-0.5">{s.rationale}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {md.market_gaps?.length > 0 && (
          <div className="card">
            <div className="label mb-3">Your Market Gaps</div>
            <div className="flex flex-wrap gap-2">
              {md.market_gaps.map((g: string) => (
                <span key={g} className="badge bg-red-600/20 text-red-400">{g}</span>
              ))}
            </div>
          </div>
        )}
        {md.top_hiring_companies?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 label mb-3"><Building2 size={12} />Top Hiring Companies</div>
            <div className="flex flex-wrap gap-2">
              {md.top_hiring_companies.map((c: string) => (
                <span key={c} className="badge bg-surface-600 text-slate-300">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {md.market_summary && (
        <div className="card">
          <div className="label mb-2">Market Summary</div>
          <p className="text-slate-300 text-sm leading-relaxed">{md.market_summary}</p>
        </div>
      )}
    </div>
  )
}
