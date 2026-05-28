"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const router = useRouter()
  const { activeUser, isLoaded, register } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded || !activeUser) return
    router.replace(activeUser.role === "admin" ? "/admin" : "/dashboard")
  }, [activeUser, isLoaded, router])

  const passwordChecks = useMemo(
    () => [
      { label: "Ít nhất 8 ký tự", valid: password.length >= 8 },
      { label: "Có chữ cái", valid: /[A-Za-z]/.test(password) },
      { label: "Có chữ số", valid: /[0-9]/.test(password) },
      { label: "Xác nhận khớp", valid: confirmPassword.length > 0 && password === confirmPassword },
    ],
    [confirmPassword, password]
  )

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    passwordChecks.every((check) => check.valid)

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!canSubmit) {
      setError("Vui lòng kiểm tra lại họ tên, email và mật khẩu.")
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName,
        email,
        password,
      })
      router.push("/onboarding")
      router.refresh()
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Không thể tạo tài khoản.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="hidden border-r bg-muted/40 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Tạo tài khoản học N5</p>
            <h1 className="text-4xl font-bold text-balance">Mỗi người học có dữ liệu và tiến độ riêng.</h1>
            <p className="text-muted-foreground text-balance">
              Sau khi đăng ký, hệ thống tạo user trong PostgreSQL, hash mật khẩu và mở phiên đăng nhập tự động.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <UserPlus className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Tài khoản thật</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Mật khẩu hash</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <GraduationCap className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Onboarding riêng</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md border shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">日</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
              <CardDescription>Tạo tài khoản người học mới.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

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
                    placeholder="Ít nhất 8 ký tự"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn("h-4 w-4", check.valid ? "text-success" : "text-muted-foreground")} />
                    <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || !isLoaded || !canSubmit}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
