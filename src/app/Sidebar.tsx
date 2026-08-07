import { NavLink } from 'react-router'
import { Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { NAV_ITEMS } from './navConfig'
import { useUiStore } from './providers/uiStore'
import { useAuth } from './providers/AuthProvider'
import { visibleModules, type Role } from '@/shared/lib/permissions'
import { cn } from '@/shared/lib/cn'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { appUser, logout } = useAuth()
  const role: Role = appUser?.role ?? 'manager'
  const allowed = new Set(visibleModules(role))

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-[var(--bg-sidebar)] text-white transition-[width] duration-150',
        sidebarCollapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Building2 className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold">Waterman</div>
            <div className="text-xs text-white/60">Construction ERP</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {NAV_ITEMS.filter((item) => allowed.has(item.key)).map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-[var(--bg-sidebar-active)] text-white' : 'text-white/70 hover:bg-[var(--bg-sidebar-hover)] hover:text-white'
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 px-2 py-2">
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-[var(--bg-sidebar-hover)] hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && 'Logout'}
        </button>
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-[var(--bg-sidebar-hover)] hover:text-white"
        >
          {sidebarCollapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!sidebarCollapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}
