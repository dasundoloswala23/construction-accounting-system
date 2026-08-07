import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from './providers/AuthProvider'
import { canView, type ModuleKey, type Role } from '@/shared/lib/permissions'
import { EmptyState } from '@/shared/components'

export function RequireModule({ moduleKey, children }: { moduleKey: ModuleKey; children: ReactNode }) {
  const { appUser } = useAuth()
  const role: Role = appUser?.role ?? 'manager'

  if (!canView(role, moduleKey)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState icon={ShieldAlert} title="You don't have access to this module" description="Contact an administrator if you think this is a mistake." />
      </div>
    )
  }

  return <>{children}</>
}
