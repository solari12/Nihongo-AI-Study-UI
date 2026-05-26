"use client"

import { Bell, Search, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface HeaderProps {
  userName?: string
  userAvatar?: string
  learningStreak?: number
}

export function Header({ 
  userName = "Nguyễn Văn Tuấn", 
  userAvatar,
  learningStreak = 7 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm từ vựng, ngữ pháp..."
          className="w-full pl-10 bg-muted/50"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Learning streak */}
        <div className="hidden items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 sm:flex">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent-foreground">
            {learningStreak} ngày streak
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Đã đến giờ ôn tập!</span>
              <span className="text-sm text-muted-foreground">
                Bạn có 10 từ vựng cần ôn lại hôm nay
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Hoàn thành mục tiêu tuần</span>
              <span className="text-sm text-muted-foreground">
                Bạn đã học 50 từ vựng tuần này
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Bài học mới</span>
              <span className="text-sm text-muted-foreground">
                Ngữ pháp mới: N じゃありません đã sẵn sàng
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userName.split(" ").map(n => n[0]).join("").slice(-2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden font-medium sm:block">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Hồ sơ cá nhân</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/history">Lịch sử học tập</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/learning-path">Lộ trình học</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive">
              <Link href="/">Đăng xuất</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
