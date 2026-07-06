import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?:    ReactNode
  message?: string
  sub?:     string
  action?:  { label: string; to: string }
}

export default function EmptyState({
  icon,
  message = 'No data yet',
  sub     = 'Upload your resume to get started.',
  action  = { label: 'Upload Resume', to: '/upload' },
}: EmptyStateProps) {
  const navigate = useNavigate()
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-4 text-center min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-surface-700 border border-surface-600 flex items-center justify-center text-slate-500">
        {icon ?? <Upload size={26} />}
      </div>
      <div>
        <p className="text-white font-medium mb-1">{message}</p>
        <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">{sub}</p>
      </div>
      <button className="btn-primary flex items-center gap-2" onClick={() => navigate(action.to)}>
        <Upload size={14} />{action.label}
      </button>
    </div>
  )
}
