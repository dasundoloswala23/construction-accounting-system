import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  type User,
} from 'firebase/auth'
import { auth, AUTH_PERSISTENCE } from '@/shared/lib/firebase'
import { useDocument } from '@/shared/hooks/useDocument'
import type { AppUser } from '@/shared/types/entities'

interface AuthContextValue {
  user: User | null
  appUser: (AppUser & { id: string }) | null
  loading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
  }, [])

  const { data: appUser, loading: profileLoading } = useDocument<AppUser>(user ? `users/${user.uid}` : null)

  async function login(email: string, password: string, remember: boolean) {
    await setPersistence(auth, remember ? AUTH_PERSISTENCE.remember : AUTH_PERSISTENCE.session)
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  const loading = authLoading || (!!user && profileLoading)

  return (
    <AuthContext.Provider value={{ user, appUser, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
