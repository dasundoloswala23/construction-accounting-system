import { useState } from 'react'
import { Building2, Users, ShieldCheck, Bell, SunMoon, Database, Info } from 'lucide-react'
import { Breadcrumb } from '@/shared/components'
import { cn } from '@/shared/lib/cn'
import { CompanySection } from './components/CompanySection'
import { UsersSection } from './components/UsersSection'
import { PermissionsSection } from './components/PermissionsSection'
import { NotificationsSettingsSection } from './components/NotificationsSettingsSection'
import { ThemeSection } from './components/ThemeSection'
import { BackupSection } from './components/BackupSection'
import { AboutSection } from './components/AboutSection'

const SECTIONS = [
  { key: 'company', label: 'Company', icon: Building2, component: CompanySection },
  { key: 'users', label: 'Users', icon: Users, component: UsersSection },
  { key: 'permissions', label: 'Permissions', icon: ShieldCheck, component: PermissionsSection },
  { key: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSettingsSection },
  { key: 'theme', label: 'Theme', icon: SunMoon, component: ThemeSection },
  { key: 'backup', label: 'Backup', icon: Database, component: BackupSection },
  { key: 'about', label: 'About', icon: Info, component: AboutSection },
] as const

export function SettingsPage() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]['key']>('company')
  const ActiveComponent = SECTIONS.find((s) => s.key === active)?.component ?? CompanySection

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }]} />
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active === s.key ? 'bg-brand-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]'
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div>
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
