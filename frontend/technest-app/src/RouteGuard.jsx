// frontend/technest-app/src/RouteGuard.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

const norm = r => (r ? String(r).toUpperCase().replace(/^ROLE_/,'') : '')

export const PrivateRoute = ({ children }) => {
  const { user, ready } = useAuth()
  if (!ready) return null   // tránh redirect khi chưa load xong
  return user ? children : <Navigate to="/signin" replace />
}

export const AdminRoute = ({ children }) => {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/signin" replace />
  return norm(user.role) === 'ADMIN' ? children : <Navigate to="/" replace />
}

export const StaffRoute = ({ children }) => {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user) return <Navigate to="/signin" replace />
  return norm(user.role) === 'STAFF' ? children : <Navigate to="/" replace />
}
