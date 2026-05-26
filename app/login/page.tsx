"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Sparkles, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { demoAccounts, type DemoRole, useDemoAuth } from "@/hooks/use-demo-auth"

export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useDemoAuth()
  const [selectedRole, setSelectedRole] = useState<DemoRole>("learner")
  const [email, setEmail] = useState(demoAccounts.learner.email)

  const handleRoleChange = (role: DemoRole) => {
    setSelectedRole(role)
    setEmail(demoAccounts[role].email)
  }

  const handleLogin = () => {
    loginAs(selectedRole, { email: email || demoAccounts[selectedRole].email })
    router.push(selectedRole === "admin" ? "/admin" : "/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">日</span>
            </div>
            <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
            <CardDescription>
              Học tiếng Nhật N5 thông minh cùng AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleChange("learner")}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedRole === "learner" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <UserRound className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Người học</p>
                <p className="text-xs text-muted-foreground">Học, quiz, xem gợi ý AI</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedRole === "admin" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Quản lý dữ liệu N5</p>
              </button>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="mb-2">Tài khoản demo</Badge>
              <p>{selectedRole === "admin" ? "Admin có quyền vào trang Quản trị." : "Người học tập trung vào học, quiz và lộ trình."}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full" size="lg" onClick={handleLogin}>
              Đăng nhập với vai {selectedRole === "admin" ? "Admin" : "Người học"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
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

      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:bg-muted lg:p-12">
        <div className="max-w-lg space-y-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <span className="text-5xl font-bold">日</span>
          </div>
          <h1 className="text-4xl font-bold text-balance">Nihongo AI Study</h1>
          <p className="text-lg text-muted-foreground text-balance">
            Học tiếng Nhật N5 với chatbot RAG, quiz, lịch sử học tập và lộ trình cá nhân hóa.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg bg-card p-4 shadow-sm">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-medium">Nội dung N5</h3>
              <p className="text-sm text-muted-foreground">Từ vựng, ngữ pháp, quiz</p>
            </div>
            <div className="rounded-lg bg-card p-4 shadow-sm">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-accent" />
              <h3 className="font-medium">AI hỗ trợ</h3>
              <p className="text-sm text-muted-foreground">RAG và gợi ý học tập</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
