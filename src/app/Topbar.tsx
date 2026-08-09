import { useState } from 'react'
import { Link } from 'react-router'
import { Menu, Search, Sun, Moon, Bell, MessageSquare, ChevronDown } from 'lucide-react'
import { where } from 'firebase/firestore'
import { useUiStore } from './providers/uiStore'
import { useThemeStore } from './providers/themeStore'
import { useAuth } from './providers/AuthProvider'
import { useCollection } from '@/shared/hooks/useCollection'
import type { AppNotification } from '@/shared/types/entities'
import { ROLE_LABELS, type Role } from '@/shared/lib/permissions'
import { cn } from '@/shared/lib/cn'

export function Topbar() {
  const { toggleMobileSidebar } = useUiStore()
  const { theme, toggleTheme } = useThemeStore()
  const { appUser, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: unread } = useCollection<AppNotification>('notifications', [where('read', '==', false)])

  const role: Role = appUser?.role ?? 'manager'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4">
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)] lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search anything…"
            className="h-10 w-full rounded-lg bg-[var(--bg-surface-muted)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <Link
          to="/notifications"
          className="relative rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />}
        </Link>
        <button className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]" aria-label="Messages">
          <MessageSquare className="h-5 w-5" />
        </button>

        <div className="relative ml-1">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-[var(--bg-surface-muted)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {(appUser?.displayName ?? 'U').charAt(0)}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-medium text-[var(--text-primary)]">{appUser?.displayName ?? 'User'}</div>
              <div className="text-xs text-[var(--text-muted)]">{ROLE_LABELS[role]}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className={cn(
                  'absolute right-0 z-20 mt-2 w-44 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 shadow-lg'
                )}
              >
                <Link
                  to="/settings"
                  className="block px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => void logout()}
                  className="block w-full px-3 py-2 text-left text-sm text-danger-500 hover:bg-[var(--bg-surface-muted)]"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
