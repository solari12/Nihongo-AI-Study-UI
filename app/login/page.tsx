"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { BookOpen, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("learner@example.com")
  const [password, setPassword] = useState("password123")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const user = await login({ email, password })
      router.push(user?.role === "admin" ? "/admin" : "/dashboard")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Khong the dang nhap.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xl font-bold">日</span>
            </div>
            <CardTitle className="text-2xl font-bold">Dang nhap</CardTitle>
            <CardDescription>Dang nhap bang tai khoan duoc luu trong PostgreSQL.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("learner@example.com")
                    setPassword("password123")
                  }}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <UserRound className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-medium">Nguoi hoc</p>
                  <p className="text-xs text-muted-foreground">learner@example.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@example.com")
                    setPassword("password123")
                  }}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">admin@example.com</p>
                </button>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="mb-2">Database auth</Badge>
                <p>Mat khau demo mac dinh: password123. Sau nay co the doi trong database.</p>
              </div>

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mat khau</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Quen mat khau?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoac</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Chua co tai khoan?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Dang ky ngay
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
            Hoc tieng Nhat N5 voi chatbot RAG, quiz, lich su hoc tap va lo trinh ca nhan hoa.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg bg-card p-4 shadow-sm">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-medium">Noi dung N5</h3>
              <p className="text-sm text-muted-foreground">Tu vung, ngu phap, quiz</p>
            </div>
            <div className="rounded-lg bg-card p-4 shadow-sm">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-accent" />
              <h3 className="font-medium">AI ho tro</h3>
              <p className="text-sm text-muted-foreground">RAG va goi y hoc tap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
