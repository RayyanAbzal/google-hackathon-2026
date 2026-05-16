'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
  width: number
}

const STORAGE_KEY = 'sidebar_collapsed'
export const SIDEBAR_EXPANDED = 240
export const SIDEBAR_COLLAPSED = 56

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  width: SIDEBAR_EXPANDED,
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  function toggle() {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext)
}
