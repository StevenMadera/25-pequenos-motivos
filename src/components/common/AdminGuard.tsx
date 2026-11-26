import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { supabase } from '../../services/supabase'

type AccessStatus = 'checking' | 'allowed' | 'denied'

export default function AdminGuard() {
  const [status, setStatus] = useState<AccessStatus>('checking')

  useEffect(() => {
    let active = true

    const verifyAccess = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          if (active) setStatus('denied')
          return
        }

        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error || !data) {
          await supabase.auth.signOut()

          if (active) setStatus('denied')
          return
        }

        if (active) setStatus('allowed')
      } catch {
        if (active) setStatus('denied')
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus('denied')
      }
    })

    void verifyAccess()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (status === 'checking') {
    return (
      <main className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Verificando acceso...</p>
      </main>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}