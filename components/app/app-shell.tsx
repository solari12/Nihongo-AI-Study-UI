"use client"

import { useState, createContext, useContext } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { type ClientAuthUser, useAuth } from "@/hooks/use-auth"

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
  user: ClientAuthUser
}

export function AppShell({ children, user: initialUser }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { activeUser } = useAuth(initialUser)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-[#fbf5ee] bg-[url('/assets/wallpaper.png')] bg-cover bg-center bg-fixed">
        <Sidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          role={activeUser?.role ?? "learner"}
        />
        <div 
          className={cn(
            "flex min-h-screen flex-col transition-all duration-300",
            collapsed ? "ml-16" : "ml-64",
            "max-lg:ml-0"
          )}
        >
          <Header
            userName={activeUser?.name}
            userEmail={activeUser?.email}
            userRole={activeUser?.role}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
