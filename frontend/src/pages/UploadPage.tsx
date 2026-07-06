import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { useAnalysisStore } from '@/store/analysisStore'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import clsx from 'clsx'

const AGENT_STEPS = [
  'Resume Intelligence Agent — parsing skills & projects',
  'GitHub Skill Verifier — checking real code',
  'Recruiter Simulation Agent — scoring profile',
  'ATS Optimization Agent — keyword matching',
  'Market Intelligence Agent — demand analysis',
  'Project Generator Agent — building recommendations',
  'Roadmap Planner Agent — 180-day plan',
  'Scoring Engine — computing employability score',
]

export default function UploadPage() {
  const [file, setFile]             = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [github, setGithub]         = useState('')
  const [jobDesc, setJobDesc]       = useState('')
  const [step, setStep]             = useState(-1)
  const { uploadResume, loading, error, clearError } = useAnalysisStore()
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setFile(accepted[0]); clearError() }
  }, [clearError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (r) => {
      const err = r[0]?.errors[0]
      toast.error(err?.code === 'file-too-large' ? 'File too large (max 5 MB)' : 'Invalid file type. Use PDF or DOCX.')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please upload a resume file'); return }

    const fd = new FormData()
    fd.append('resume', file)
    fd.append('target_role', targetRole.trim() || user?.target_role || 'Software Engineer')
    fd.append('github_username', (github.trim() || user?.github_username || ''))
    if (jobDesc.trim()) fd.append('job_description', jobDesc.trim())

    setStep(0)
    // Simulate agent progress during the real API call
    const interval = setInterval(() => {
      setStep(s => (s < AGENT_STEPS.length - 1 ? s + 1 : s))
    }, 4000)

    try {
      await uploadResume(fd)
      clearInterval(interval)
      setStep(AGENT_STEPS.length)
      toast.success('Analysis complete!')
      setTimeout(() => navigate('/'), 600)
    } catch (err: any) {
      clearInterval(interval)
      setStep(-1)
      toast.error(err.message || 'Analysis failed. Check backend logs.')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Upload Resume</h1>
        <p className="text-slate-400 text-sm mt-1">Run the full 8-agent AI analysis pipeline (3–8 minutes on CPU with Ollama)</p>
      </div>

      {error && (
        <div className="card border border-red-600/40 bg-red-600/5">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-1">Check that Ollama is running and model is pulled: <code className="font-mono">ollama pull llama3.2:3b</code></p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
            isDragActive && 'border-brand-500 bg-brand-600/10 scale-[1.01]',
            !isDragActive && !file && 'border-surface-500 hover:border-surface-400',
            file && 'border-green-600/60 bg-green-600/5',
          )}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <FileText size={36} className="text-green-400" />
              <div>
                <div className="text-white font-medium">{file.name}</div>
                <div className="text-slate-400 text-sm mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
              </div>
              <span className="badge bg-green-600/20 text-green-400">Ready to analyse</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload size={36} className="text-slate-500" />
              <div>
                <div className="text-white font-medium">{isDragActive ? 'Drop it here…' : 'Drag & drop your resume'}</div>
                <div className="text-slate-400 text-sm mt-1">PDF or DOCX · Max 5 MB</div>
              </div>
              <span className="btn-secondary pointer-events-none">Browse Files</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target Role</label>
            <input className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)}
              placeholder={user?.target_role || 'Software Engineer'} />
          </div>
          <div>
            <label className="label">GitHub Username</label>
            <input className="input" value={github} onChange={e => setGithub(e.target.value)}
              placeholder={user?.github_username || 'octocat'} />
          </div>
        </div>

        <div>
          <label className="label">Job Description <span className="text-slate-600 normal-case font-normal">(optional — improves ATS accuracy)</span></label>
          <textarea className="input resize-none" rows={5} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
            placeholder="Paste the job description here…" />
        </div>

        <button type="submit" disabled={loading || !file} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading
            ? <><Loader2 size={16} className="animate-spin" />Running Analysis…</>
            : <><Upload size={16} />Analyse My Profile</>}
        </button>

        {/* Agent progress panel */}
        {loading && step >= 0 && (
          <div className="card space-y-2.5">
            <div className="text-white text-xs font-medium uppercase tracking-wide mb-2">
              Pipeline Running — 3–8 minutes with Ollama (first run loads model into RAM)
            </div>
            {AGENT_STEPS.map((agent, i) => (
              <div key={agent} className="flex items-center gap-3 text-sm">
                {i < step
                  ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                  : i === step
                  ? <Loader2 size={14} className="animate-spin text-brand-400 flex-shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-surface-500 flex-shrink-0" />}
                <span className={clsx(
                  'transition-colors',
                  i < step   && 'text-green-400',
                  i === step && 'text-white',
                  i > step   && 'text-slate-600',
                )}>{agent}</span>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
