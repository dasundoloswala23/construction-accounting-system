import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './providers/AuthProvider'
import { LoadingBlock } from '@/shared/components'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <LoadingBlock label="Loading Waterman Construction ERP…" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
