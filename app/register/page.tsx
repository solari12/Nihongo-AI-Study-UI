"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, GraduationCap, Rocket } from "lucide-react"
import { useDemoAuth } from "@/hooks/use-demo-auth"

export default function RegisterPage() {
  const router = useRouter()
  const { registerLearner } = useDemoAuth()
  const [fullName, setFullName] = useState("Nguyễn Văn Tuấn")
  const [email, setEmail] = useState("learner@nihongo.local")
  const [goal, setGoal] = useState("Thi JLPT N5")

  const handleRegister = () => {
    registerLearner({
      name: fullName || "Người học N5",
      email: email || "learner@nihongo.local",
      goal,
    })
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-success/10 lg:via-primary/10 lg:to-accent/10 lg:p-12">
        <div className="max-w-lg space-y-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-5xl font-bold">日</span>
          </div>
          <h1 className="text-4xl font-bold text-balance">
            Bắt đầu hành trình học tiếng Nhật
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            Tham gia cùng hàng nghìn sinh viên Việt Nam đang học tiếng Nhật N5 với AI
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <Target className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Mục tiêu rõ ràng</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <GraduationCap className="mx-auto mb-2 h-6 w-6 text-success" />
              <p className="text-sm font-medium">Học có hệ thống</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <Rocket className="mx-auto mb-2 h-6 w-6 text-accent" />
              <p className="text-sm font-medium">Tiến bộ nhanh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <span className="text-xl font-bold">日</span>
            </div>
            <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
            <CardDescription>
              Đăng ký để bắt đầu học tiếng Nhật
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Mục tiêu học tập</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mục tiêu của bạn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Giao tiếp cơ bản">Giao tiếp cơ bản</SelectItem>
                  <SelectItem value="Thi JLPT N5">Thi JLPT N5</SelectItem>
                  <SelectItem value="Học từ đầu">Học từ đầu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" size="lg" onClick={handleRegister}>
              Tạo tài khoản
            </Button>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
