"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Route,
  Settings,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/app/language-switcher"
import { type AuthRole, useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/onboarding", labelKey: "nav.onboarding", icon: ClipboardCheck },
  { href: "/vocabulary", labelKey: "nav.vocabulary", icon: BookOpen },
  { href: "/grammar", labelKey: "nav.grammar", icon: FileText },
  { href: "/quiz", labelKey: "nav.quiz", icon: HelpCircle },
  { href: "/chatbot", labelKey: "nav.chatbot", icon: MessageSquare },
  { href: "/learning-path", labelKey: "nav.learningPath", icon: Route },
  { href: "/history", labelKey: "nav.history", icon: History },
  { href: "/profile", labelKey: "nav.profile", icon: User },
  { href: "/admin", labelKey: "nav.admin", icon: Settings },
] as const

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
  const router = useRouter()
  const { logout } = useAuth()
  const { t } = useI18n()
  const visibleNavItems = navItems.filter((item) => role === "admin" || item.href !== "/admin")

  const handleLogout = async () => {
    await logout()
    if (isMobile) onCollapsedChange?.(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              日
            </div>
            <span className="font-semibold text-sidebar-foreground">Nihongo AI Study</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Link href="/dashboard" className="mx-auto flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              日
            </div>
          </Link>
        )}
        {isMobile && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              日
            </div>
            <span className="font-semibold text-sidebar-foreground">Nihongo AI Study</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            const label = t(item.labelKey)

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
                  title={collapsed && !isMobile ? label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {(!collapsed || isMobile) && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {(!collapsed || isMobile) && (
          <div className="mb-2">
            <LanguageSwitcher />
          </div>
        )}

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
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>{t("nav.collapse")}</span>
              </>
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "mt-1 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
            collapsed && !isMobile && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || isMobile) && <span className="ml-2">{t("auth.logout")}</span>}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ collapsed = false, onCollapsedChange, role = "learner" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onCollapsedChange={onCollapsedChange} role={role} />
      </aside>

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
