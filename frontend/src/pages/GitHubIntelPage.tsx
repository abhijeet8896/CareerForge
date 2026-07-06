import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { Github, CheckCircle, AlertTriangle, Star, ExternalLink } from 'lucide-react'

export default function GitHubIntelPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!current) return <EmptyState icon={<Github size={28} />} message="No GitHub analysis yet" />

  const gh = current.github_analysis || {}
  const verified = gh.verified_skills?.filter((s: any) => s.verdict === 'verified') || []
  const weak = gh.verified_skills?.filter((s: any) => s.verdict !== 'verified') || []

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Github size={18} className="text-brand-400" />
        </div>
        <div className="flex-1">
          <h1 className="section-title">GitHub Intelligence</h1>
          <p className="text-slate-400 text-xs mt-0.5">Skill verification against real code</p>
        </div>
        {gh.username && (
          <a href={`https://github.com/${gh.username}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-brand-400 text-sm transition-colors">
            @{gh.username} <ExternalLink size={12} />
          </a>
        )}
      </div>

      {gh.note && (
        <div className="card border border-amber-600/30">
          <p className="text-amber-400 text-sm">{gh.note}</p>
          <p className="text-slate-500 text-xs mt-1">Add GITHUB_TOKEN to your .env and provide a username to enable deep analysis.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Repos Analysed', value: gh.repos_analyzed ?? 0, color: 'text-white' },
          { label: 'Verified Skills', value: verified.length, color: 'text-green-400' },
          { label: 'Weak Evidence', value: weak.length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card items-center text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="stat-label text-center">{label}</div>
          </div>
        ))}
      </div>

      {gh.verified_skills?.length > 0 && (
        <div className="card">
          <div className="label mb-4">Skill Verification</div>
          <div className="space-y-3">
            {gh.verified_skills.map((s: any) => (
              <div key={s.skill} className="space-y-1">
                <div className="flex items-center gap-3">
                  {s.verdict === 'verified'
                    ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    : <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />}
                  <span className="text-white text-sm font-medium w-28 flex-shrink-0">{s.skill}</span>
                  <div className="flex-1 progress-bar h-1.5">
                    <div className={`progress-fill h-1.5 ${s.verdict === 'verified' ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.round(s.confidence * 100)}%` }} />
                  </div>
                  <span className="text-slate-400 text-xs w-10 text-right flex-shrink-0">{Math.round(s.confidence * 100)}%</span>
                  <span className={`badge text-xs flex-shrink-0 ${s.verdict === 'verified' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>
                    {s.verdict}
                  </span>
                  {!s.claimed_on_resume && s.verdict === 'verified' && (
                    <span className="badge bg-blue-600/20 text-blue-400 text-xs flex-shrink-0">hidden gem</span>
                  )}
                </div>
                <div className="text-slate-600 text-xs ml-7">Found in {s.repo_hits ?? 0} file(s)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gh.repos?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Top Repositories</div>
          <div className="space-y-3">
            {gh.repos.map((r: any) => (
              <div key={r.name} className="flex items-start justify-between border-b border-surface-600 pb-3 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="text-white text-sm font-medium hover:text-brand-400 transition-colors flex items-center gap-1.5">
                    {r.name} <ExternalLink size={11} />
                  </a>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.skills?.map((skill: string) => (
                      <span key={skill} className="badge bg-brand-600/15 text-brand-400 text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs flex-shrink-0 ml-4">
                  {r.language && <span>{r.language}</span>}
                  {r.stars > 0 && (
                    <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" />{r.stars}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
