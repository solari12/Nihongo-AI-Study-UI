"use client"

import { useState, createContext, useContext } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div 
          className={cn(
            "flex min-h-screen flex-col transition-all duration-300",
            collapsed ? "ml-16" : "ml-64",
            "max-lg:ml-0"
          )}
        >
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
