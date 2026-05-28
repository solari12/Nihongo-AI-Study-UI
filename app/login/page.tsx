"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { BookOpen, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { activeUser, isLoaded, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded || !activeUser) return
    router.replace(activeUser.role === "admin" ? "/admin" : "/dashboard")
  }, [activeUser, isLoaded, router])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const user = await login({ email, password })
      router.push(user?.role === "admin" ? "/admin" : "/dashboard")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Không thể đăng nhập.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md border shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">日</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
              <CardDescription>Tiếp tục học với tài khoản đã đăng ký.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || !isLoaded}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
          </CardFooter>
        </Card>
      </section>

      <section className="hidden border-l bg-muted/40 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Nihongo AI Study</p>
            <h1 className="text-4xl font-bold text-balance">Học N5 với dữ liệu cá nhân được lưu trong PostgreSQL.</h1>
            <p className="text-muted-foreground text-balance">
              Tài khoản, phiên đăng nhập, tiến độ học, quiz và lịch sử hoạt động được gắn với từng người dùng.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">Session bảo mật</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cookie httpOnly và token hash trong database.</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <BookOpen className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">Tiến độ riêng</h2>
              <p className="mt-1 text-sm text-muted-foreground">Dữ liệu học tập được tách theo tài khoản.</p>
            </div>
            <div className="rounded-lg border bg-card p-4 sm:col-span-2">
              <Sparkles className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">Chatbot theo nội dung hệ thống</h2>
              <p className="mt-1 text-sm text-muted-foreground">Câu hỏi được xử lý qua API đã yêu cầu đăng nhập.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
