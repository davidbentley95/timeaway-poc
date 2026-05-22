import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('users').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  const login = (u) => {
    setUser(u)
    localStorage.setItem('timeaway_user', u.user_id)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('timeaway_user')
  }

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('timeaway_user')
    if (saved && users.length > 0) {
      const found = users.find(u => u.user_id === saved)
      if (found) setUser(found)
    }
  }, [users])

  return (
    <AuthContext.Provider value={{ user, users, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
