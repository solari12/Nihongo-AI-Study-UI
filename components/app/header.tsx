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
  userName = "Nguy\u1ec5n V\u0103n Tu\u1ea5n",
  userEmail = "learner@nihongo.local",
  userRole = "learner",
  userAvatar,
  learningStreak = 0,
}: HeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const { locale } = useI18n()
  const isJapanese = locale === "ja"
  const copy = {
    search: isJapanese ? "\u8a9e\u5f59\u3001\u6587\u6cd5\u3092\u691c\u7d22..." : "T\u00ecm ki\u1ebfm t\u1eeb v\u1ef1ng, ng\u1eef ph\u00e1p...",
    streak: isJapanese ? "\u65e5\u9023\u7d9a" : "ng\u00e0y streak",
    admin: isJapanese ? "\u7ba1\u7406\u8005" : "Admin",
    learner: isJapanese ? "\u5b66\u7fd2\u8005" : "Ng\u01b0\u1eddi h\u1ecdc",
    notifications: isJapanese ? "\u901a\u77e5" : "Th\u00f4ng b\u00e1o",
    noNotifications: isJapanese ? "\u901a\u77e5\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093" : "Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o",
    notificationHelp: isJapanese
      ? "\u5b66\u7fd2\u3092\u59cb\u3081\u308b\u3068\u901a\u77e5\u304c\u8868\u793a\u3055\u308c\u307e\u3059\u3002"
      : "Th\u00f4ng b\u00e1o s\u1ebd xu\u1ea5t hi\u1ec7n sau khi b\u1ea1n b\u1eaft \u0111\u1ea7u h\u1ecdc.",
    account: isJapanese ? "\u30de\u30a4\u30a2\u30ab\u30a6\u30f3\u30c8" : "T\u00e0i kho\u1ea3n c\u1ee7a t\u00f4i",
    profile: isJapanese ? "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb" : "H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n",
    history: isJapanese ? "\u5b66\u7fd2\u5c65\u6b74" : "L\u1ecbch s\u1eed h\u1ecdc t\u1eadp",
    learningPath: isJapanese ? "\u5b66\u7fd2\u30eb\u30fc\u30c8" : "L\u1ed9 tr\u00ecnh h\u1ecdc",
    logout: isJapanese ? "\u30ed\u30b0\u30a2\u30a6\u30c8" : "\u0110\u0103ng xu\u1ea5t",
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <header data-i18n-managed className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder={copy.search} className="w-full bg-muted/50 pl-10" />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 sm:flex">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent-foreground">
            {learningStreak} {copy.streak}
          </span>
        </div>

        <Badge variant={userRole === "admin" ? "default" : "outline"} className="hidden gap-1 sm:flex">
          {userRole === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
          {userRole === "admin" ? copy.admin : copy.learner}
        </Badge>

        <div className="hidden sm:block">
          <LanguageSwitcher compact />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{copy.notifications}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">{copy.noNotifications}</span>
              <span className="text-sm text-muted-foreground">{copy.notificationHelp}</span>
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
            <DropdownMenuLabel>{copy.account}</DropdownMenuLabel>
            <div className="px-2 pb-2 text-xs text-muted-foreground">{userEmail}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">{copy.profile}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history">{copy.history}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/learning-path">{copy.learningPath}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {copy.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
