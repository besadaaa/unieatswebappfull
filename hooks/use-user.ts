import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: 'student' | 'cafeteria_manager' | 'admin'
  full_name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error('Error loading user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const refreshUser = async () => {
    try {
      setError(null)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      console.error('Error refreshing user:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh user')
    }
  }

  return {
    user,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCafeteriaManager: user?.role === 'cafeteria_manager',
    isStudent: user?.role === 'student'
  }
}
