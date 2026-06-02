"use client"

import Link from "next/link"
import Image from "next/image"
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
  Languages,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
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
  { href: "/dashboard", labelKey: "nav.dashboard", viLabel: "Dashboard", jaLabel: "\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9", icon: LayoutDashboard },
  { href: "/onboarding", labelKey: "nav.onboarding", viLabel: "H\u1ed3 s\u01a1 h\u1ecdc", jaLabel: "\u5b66\u7fd2\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb", icon: ClipboardCheck },
  { href: "/kana", labelKey: "nav.kana", viLabel: "B\u1ea3ng Kana", jaLabel: "\u304b\u306a\u8868", icon: Languages },
  { href: "/reading", labelKey: "nav.reading", viLabel: "B\u00e0i \u0111\u1ecdc song ng\u1eef", jaLabel: "\u30d0\u30a4\u30ea\u30f3\u30ac\u30eb\u8aad\u89e3", icon: Newspaper },
  { href: "/vocabulary", labelKey: "nav.vocabulary", viLabel: "T\u1eeb v\u1ef1ng", jaLabel: "\u8a9e\u5f59", icon: BookOpen },
  { href: "/grammar", labelKey: "nav.grammar", viLabel: "Ng\u1eef ph\u00e1p", jaLabel: "\u6587\u6cd5", icon: FileText },
  { href: "/quiz", labelKey: "nav.quiz", viLabel: "Quiz", jaLabel: "\u30af\u30a4\u30ba", icon: HelpCircle },
  { href: "/chatbot", labelKey: "nav.chatbot", viLabel: "Chatbot AI", jaLabel: "AI\u30c1\u30e3\u30c3\u30c8", icon: MessageSquare },
  { href: "/learning-path", labelKey: "nav.learningPath", viLabel: "L\u1ed9 tr\u00ecnh h\u1ecdc", jaLabel: "\u5b66\u7fd2\u30eb\u30fc\u30c8", icon: Route },
  { href: "/history", labelKey: "nav.history", viLabel: "L\u1ecbch s\u1eed h\u1ecdc t\u1eadp", jaLabel: "\u5b66\u7fd2\u5c65\u6b74", icon: History },
  { href: "/profile", labelKey: "nav.profile", viLabel: "H\u1ed3 s\u01a1", jaLabel: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb", icon: User },
  { href: "/admin", labelKey: "nav.admin", viLabel: "Qu\u1ea3n tr\u1ecb", jaLabel: "\u7ba1\u7406", icon: Settings },
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
  const { locale } = useI18n()
  const visibleNavItems = navItems.filter((item) => role === "admin" || item.href !== "/admin")

  const handleLogout = async () => {
    await logout()
    if (isMobile) onCollapsedChange?.(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <div data-i18n-managed className="relative flex h-full flex-col overflow-hidden bg-[#fae1dc] text-[#2a211f]">
      <Image
        src="/assets/sidebar.png"
        alt=""
        width={278}
        height={992}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-95"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/18 via-transparent to-white/16" />

      <div className="relative flex h-16 items-center justify-between border-b border-[#e7bdb4]/70 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2a7a2] text-sm font-bold text-white shadow-[0_8px_18px_rgba(143,71,66,0.22)]">
              {"\u65e5"}
            </div>
            <span className="font-semibold leading-tight text-[#2a211f]">Nihongo AI Study</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <Link href="/dashboard" className="mx-auto flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2a7a2] text-sm font-bold text-white shadow-[0_8px_18px_rgba(143,71,66,0.22)]">
              {"\u65e5"}
            </div>
          </Link>
        )}
        {isMobile && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2a7a2] text-sm font-bold text-white shadow-[0_8px_18px_rgba(143,71,66,0.22)]">
              {"\u65e5"}
            </div>
            <span className="font-semibold leading-tight text-[#2a211f]">Nihongo AI Study</span>
          </Link>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href
            const label = locale === "ja" ? item.jaLabel : item.viLabel

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#d86f75] text-white shadow-[0_10px_18px_rgba(143,71,66,0.24)]"
                      : "text-[#2f2825] hover:bg-white/45 hover:text-[#8f4742]"
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

      <div className="relative border-t border-[#e7bdb4]/70 p-3">
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
              "w-full justify-start text-[#2f2825] hover:bg-white/45 hover:text-[#8f4742]",
              collapsed && "justify-center px-0"
            )}
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>{locale === "ja" ? "\u6298\u308a\u305f\u305f\u3080" : "Thu g\u1ecdn"}</span>
              </>
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "mt-1 w-full justify-start text-[#b94d55] hover:bg-[#f3c8bd]/50 hover:text-[#8f4742]",
            collapsed && !isMobile && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || isMobile) && (
            <span className="ml-2">{locale === "ja" ? "\u30ed\u30b0\u30a2\u30a6\u30c8" : "\u0110\u0103ng xu\u1ea5t"}</span>
          )}
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
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#e7bdb4]/80 bg-[#fff3ef] transition-all duration-300 lg:flex",
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
          <SheetContent side="left" className="w-64 border-[#e7bdb4]/80 p-0">
            <SidebarContent isMobile onCollapsedChange={() => setMobileOpen(false)} role={role} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
