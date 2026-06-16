import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const VotePage = lazy(() => import('./pages/VotePage'))
const DisplayPage = lazy(() => import('./pages/DisplayPage'))
const SetupPage = lazy(() => import('./pages/SetupPage'))

const hasEnv =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY

function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="text-blue-400 animate-spin" size={32} />
    </div>
  )
}

export default function App() {
  if (!hasEnv) {
    return <SetupPage />
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/vote/:id" element={<VotePage />} />
          <Route path="/display/:id" element={<DisplayPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
