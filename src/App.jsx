import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AppShell from './pages/AppShell'

function Inner() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0f1623'}}>
      <div style={{color:'#8899aa',fontSize:'14px'}}>Loading TimeAway...</div>
    </div>
  )
  return user ? <AppShell /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
