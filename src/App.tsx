import { Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './api/client'
import ProtectedLayout from './components/ProtectedLayout'
import LinksPage from './pages/LinksPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StatsPage from './pages/StatsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/links" element={<LinksPage />} />
        <Route path="/links/:id/stats" element={<StatsPage />} />
      </Route>
      <Route path="/" element={<Navigate to={getToken() ? '/links' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={getToken() ? '/links' : '/login'} replace />} />
    </Routes>
  )
}
