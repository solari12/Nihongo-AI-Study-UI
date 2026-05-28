"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Flame, LogOut, Search, ShieldCheck, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/app/language-switcher"
import type { AuthRole } from "@/hooks/use-auth"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n"

interface HeaderProps {
  userName?: string
  userEmail?: string
  userRole?: AuthRole
  userAvatar?: string
  learningStreak?: number
}

export function Header({
  userName = "Nguyễn Văn Tuấn",
  userEmail = "learner@nihongo.local",
  userRole = "learner",
  userAvatar,
  learningStreak = 7,
}: HeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const { t } = useI18n()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder={t("header.search")} className="w-full bg-muted/50 pl-10" />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 sm:flex">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent-foreground">
            {learningStreak} {t("header.streak")}
          </span>
        </div>

        <Badge variant={userRole === "admin" ? "default" : "outline"} className="hidden gap-1 sm:flex">
          {userRole === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
          {userRole === "admin" ? t("header.admin") : t("header.learner")}
        </Badge>

        <div className="hidden sm:block">
          <LanguageSwitcher compact />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t("header.notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Đã đến giờ ôn tập!</span>
              <span className="text-sm text-muted-foreground">Bạn có 10 từ vựng cần ôn lại hôm nay</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Hoàn thành mục tiêu tuần</span>
              <span className="text-sm text-muted-foreground">Bạn đã học 50 từ vựng tuần này</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Bài học mới</span>
              <span className="text-sm text-muted-foreground">Ngữ pháp mới đã sẵn sàng</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {userName.split(" ").map((name) => name[0]).join("").slice(-2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden font-medium sm:block">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("header.account")}</DropdownMenuLabel>
            <div className="px-2 pb-2 text-xs text-muted-foreground">{userEmail}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">{t("header.profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history">{t("header.history")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/learning-path">{t("header.learningPath")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
