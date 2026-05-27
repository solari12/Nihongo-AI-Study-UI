"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { GraduationCap, Rocket, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [goal, setGoal] = useState("Thi JLPT N5")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Mat khau xac nhan khong khop.")
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName,
        email,
        password,
        goal,
      })
      router.push("/onboarding")
      router.refresh()
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Khong the tao tai khoan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-success/10 lg:via-primary/10 lg:to-accent/10 lg:p-12">
        <div className="max-w-lg space-y-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-5xl font-bold">日</span>
          </div>
          <h1 className="text-4xl font-bold text-balance">Bat dau hanh trinh hoc tieng Nhat</h1>
          <p className="text-lg text-muted-foreground text-balance">
            Tao tai khoan that, luu trong PostgreSQL va bao ve bang mat khau hash.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Muc tieu ro rang</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <GraduationCap className="mx-auto mb-2 h-6 w-6 text-success" />
              <p className="text-sm font-medium">Hoc co he thong</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <Rocket className="mx-auto mb-2 h-6 w-6 text-accent" />
              <p className="text-sm font-medium">Tien bo nhanh</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <span className="text-xl font-bold">日</span>
            </div>
            <CardTitle className="text-2xl font-bold">Tao tai khoan</CardTitle>
            <CardDescription>Dang ky tai khoan nguoi hoc moi.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="fullName">Ho va ten</Label>
                <Input
                  id="fullName"
                  placeholder="Nguyen Van A"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">Mat khau</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="It nhat 8 ky tu"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xac nhan mat khau</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhap lai mat khau"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Muc tieu hoc tap</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chon muc tieu cua ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Giao tiep co ban">Giao tiep co ban</SelectItem>
                    <SelectItem value="Thi JLPT N5">Thi JLPT N5</SelectItem>
                    <SelectItem value="Hoc tu dau">Hoc tu dau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Dang tao tai khoan..." : "Tao tai khoan"}
              </Button>
            </CardContent>
          </form>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Da co tai khoan?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Dang nhap
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
