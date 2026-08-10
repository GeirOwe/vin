import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/innlogging" replace />
  return <Outlet />
}

export function GuestOnly() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
