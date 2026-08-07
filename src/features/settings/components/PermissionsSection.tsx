import { Shield, ShieldCheck, ShieldHalf } from 'lucide-react'
import { Card, CardBody } from '@/shared/components'
import { NAV_ITEMS } from '@/app/navConfig'
import { PERMISSION_MATRIX, ROLE_LABELS, type Role } from '@/shared/lib/permissions'

const ROLE_ICONS: Record<Role, typeof Shield> = {
  admin: ShieldCheck,
  accountant: Shield,
  manager: ShieldHalf,
}

const ROLE_ICON_COLOR: Record<Role, string> = {
  admin: 'text-brand-600',
  accountant: 'text-accent-600',
  manager: 'text-info-600',
}

export function PermissionsSection() {
  return (
    <div className="space-y-4">
      {(Object.keys(PERMISSION_MATRIX) as Role[]).map((role) => {
        const Icon = ROLE_ICONS[role]
        const modules = NAV_ITEMS.filter((item) => PERMISSION_MATRIX[role][item.key] !== 'none')
        return (
          <Card key={role}>
            <CardBody>
              <div className="mb-3 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${ROLE_ICON_COLOR[role]}`} />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{ROLE_LABELS[role]}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => {
                  const level = PERMISSION_MATRIX[role][m.key]
                  return (
                    <span
                      key={m.key}
                      className="rounded-full bg-[var(--bg-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {m.label}
                      {level === 'view' && ' (View Only)'}
                    </span>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
