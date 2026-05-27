"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  Route,
  History,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { AuthRole } from "@/hooks/use-auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Hồ sơ học", icon: ClipboardCheck },
  { href: "/vocabulary", label: "Từ vựng", icon: BookOpen },
  { href: "/grammar", label: "Ngữ pháp", icon: FileText },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/chatbot", label: "Chatbot AI", icon: MessageSquare },
  { href: "/learning-path", label: "Lộ trình học", icon: Route },
  { href: "/history", label: "Lịch sử học tập", icon: History },
  { href: "/profile", label: "Hồ sơ", icon: User },
  { href: "/admin", label: "Quản trị", icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  role?: AuthRole
}

function SidebarContent({ 
  collapsed = false, 
  onCollapsedChange,
  isMobile = false,
  role = "learner",
}: SidebarProps & { isMobile?: boolean }) {
  const pathname = usePathname()
  const visibleNavItems = navItems.filter((item) => role === "admin" || item.href !== "/admin")

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              日
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Nihongo AI Study
            </span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Link href="/dashboard" className="mx-auto flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              日
            </div>
          </Link>
        )}
        {isMobile && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              日
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Nihongo AI Study
            </span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Thu gọn</span>
              </>
            )}
          </Button>
        )}
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mt-1 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed && !isMobile && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">Đăng xuất</span>}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function Sidebar({ collapsed = false, onCollapsedChange, role = "learner" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onCollapsedChange={onCollapsedChange} role={role} />
      </aside>

      {/* Mobile sidebar trigger */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent isMobile onCollapsedChange={() => setMobileOpen(false)} role={role} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
