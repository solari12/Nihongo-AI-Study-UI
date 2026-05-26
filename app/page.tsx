"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-xl font-bold">日</span>
            </div>
            <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
            <CardDescription>
              Học tiếng Nhật N5 thông minh cùng AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full" size="lg" asChild>
              <Link href="/dashboard">Đăng nhập</Link>
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Hoặc
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-primary/10 lg:via-accent/10 lg:to-success/10 lg:p-12">
        <div className="max-w-lg space-y-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-5xl font-bold">日</span>
          </div>
          <h1 className="text-4xl font-bold text-balance">
            Nihongo AI Study
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            Học tiếng Nhật N5 thông minh với AI chatbot hỗ trợ và lộ trình học cá nhân hóa
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-medium">500+ Từ vựng N5</h3>
              <p className="text-sm text-muted-foreground">Học có hệ thống</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-accent" />
              <h3 className="font-medium">AI Chatbot</h3>
              <p className="text-sm text-muted-foreground">Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
