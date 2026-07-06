import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import DashboardLayout  from '@/components/dashboard/DashboardLayout'
import LoginPage        from '@/pages/LoginPage'
import RegisterPage     from '@/pages/RegisterPage'
import OverviewPage     from '@/pages/OverviewPage'
import UploadPage       from '@/pages/UploadPage'
import ResumeIntelPage  from '@/pages/ResumeIntelPage'
import GitHubIntelPage  from '@/pages/GitHubIntelPage'
import RecruiterSimPage from '@/pages/RecruiterSimPage'
import MarketPage       from '@/pages/MarketPage'
import ProjectsPage     from '@/pages/ProjectsPage'
import RoadmapPage      from '@/pages/RoadmapPage'
import ATSPage          from '@/pages/ATSPage'
import WhatIfPage       from '@/pages/WhatIfPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return !token ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a26',
            color:      '#e2e8f0',
            border:     '1px solid #2d2d4a',
            fontSize:   '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Guest routes ────────────────────────────── */}
        <Route path="/login"    element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />

        {/* ── Protected dashboard routes ───────────────── */}
        <Route path="/" element={<AuthGuard><DashboardLayout /></AuthGuard>}>
          <Route index          element={<OverviewPage />} />
          <Route path="upload"   element={<UploadPage />} />
          <Route path="resume"   element={<ResumeIntelPage />} />
          <Route path="github"   element={<GitHubIntelPage />} />
          <Route path="recruiter" element={<RecruiterSimPage />} />
          <Route path="market"   element={<MarketPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="roadmap"  element={<RoadmapPage />} />
          <Route path="ats"      element={<ATSPage />} />
          <Route path="whatif"   element={<WhatIfPage />} />
        </Route>

        {/* ── Catch-all ────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
