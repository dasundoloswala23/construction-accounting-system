import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  // Mobile off-canvas drawer visibility — deliberately separate from
  // sidebarCollapsed (a persisted desktop icon-rail preference) so opening
  // the drawer on a phone doesn't get remembered as a desktop layout choice.
  mobileSidebarOpen: boolean
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      mobileSidebarOpen: false,
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
    }),
    { name: 'waterman-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
)
