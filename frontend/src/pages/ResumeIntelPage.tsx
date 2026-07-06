import { useEffect } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import EmptyState from '@/components/ui/EmptyState'
import { FileText, AlertTriangle, CheckCircle, Brain } from 'lucide-react'

export default function ResumeIntelPage() {
  const { current, fetchHistory } = useAnalysisStore()
  useEffect(() => { fetchHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return <EmptyState icon={<FileText size={28} />} message="No resume analysis yet" />

  const profile = current.resume_profile || {}

  return (
    <div className="p-6 space-y-5">
      <div className="page-header">
        <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <Brain size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="section-title">Resume Intelligence</h1>
          <p className="text-slate-400 text-xs mt-0.5">AI-extracted skills, gaps, and profile insights</p>
        </div>
      </div>

      {/* Summary */}
      {current.profile_summary && (
        <div className="card">
          <div className="label mb-2">Profile Summary</div>
          <p className="text-slate-300 text-sm leading-relaxed">{current.profile_summary}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge bg-brand-600/20 text-brand-400 capitalize">
              {current.experience_level || 'Unknown level'}
            </span>
          </div>
        </div>
      )}

      {/* Skills grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="label mb-3">
            Explicit Skills
            <span className="ml-1 text-slate-600 normal-case">({current.skills_explicit?.length ?? 0})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {current.skills_explicit?.length ? (
              current.skills_explicit.map((s: string) => (
                <span key={s} className="badge bg-brand-600/20 text-brand-400">{s}</span>
              ))
            ) : (
              <span className="text-slate-500 text-sm">None detected</span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="label mb-3">
            Inferred Skills
            <span className="ml-1 text-slate-600 normal-case">({current.skills_inferred?.length ?? 0})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {current.skills_inferred?.length ? (
              current.skills_inferred.map((s: any, i: number) => {
                const skill = typeof s === 'string' ? s : s.skill
                const conf = s.confidence ? Math.round(s.confidence * 100) : null
                const src = s.source || ''
                return (
                  <span key={i} className="badge bg-teal-600/20 text-teal-400 cursor-help" title={src}>
                    {skill}{conf !== null && <span className="ml-1 text-teal-600 text-xs">{conf}%</span>}
                  </span>
                )
              })
            ) : (
              <span className="text-slate-500 text-sm">None inferred</span>
            )}
          </div>
        </div>
      </div>

      {/* Missing critical skills */}
      {profile.missing_critical_skills?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Missing Critical Skills</div>
          <div className="flex flex-wrap gap-2">
            {profile.missing_critical_skills.map((s: string) => (
              <span key={s} className="badge bg-red-600/20 text-red-400">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {current.weaknesses?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Weaknesses Detected</div>
          <div className="space-y-2">
            {current.weaknesses.map((w: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <div className="card">
          <div className="label mb-3">Projects on Resume ({profile.projects.length})</div>
          <div className="space-y-3">
            {profile.projects.map((p: any, i: number) => (
              <div key={i} className="border border-surface-600 rounded-lg p-3 space-y-1.5">
                <div className="text-white text-sm font-medium">{p.name}</div>
                {p.description && <p className="text-slate-400 text-xs leading-relaxed">{p.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {p.tech_stack?.map((t: string) => (
                    <span key={t} className="badge bg-surface-600 text-slate-300 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education?.institution && (
        <div className="card">
          <div className="label mb-2">Education</div>
          <div className="text-white text-sm font-medium">{profile.education.degree}</div>
          <div className="text-slate-400 text-sm">{profile.education.institution}</div>
          {profile.education.year && <div className="text-slate-500 text-xs mt-1">Class of {profile.education.year}</div>}
        </div>
      )}
    </div>
  )
}
