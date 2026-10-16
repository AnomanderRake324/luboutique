import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Auth { session: Session | null; isAdmin: boolean; loading: boolean; configured: boolean }
const Ctx = createContext<Auth>({ session: null, isAdmin: false, loading: true, configured: false })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase) return
    if (!session) { setIsAdmin(false); setLoading(false); return }
    // Только для интерфейса. Реальную защиту обеспечивает RLS (is_admin()) в базе.
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setLoading(false) })
  }, [session])

  return <Ctx.Provider value={{ session, isAdmin, loading, configured: !!supabase }}>{children}</Ctx.Provider>
}
