"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  GraduationCap,
  Target,
  Calendar,
  Clock,
  Trophy,
  Medal,
  Flame,
  Star,
  Pencil,
} from "lucide-react"

const achievements = [
  {
    id: 1,
    title: "Bài học đầu tiên",
    description: "Hoàn thành bài học đầu tiên",
    icon: Star,
    earned: true,
    date: "15/04/2026",
  },
  {
    id: 2,
    title: "7 ngày streak",
    description: "Học liên tục 7 ngày",
    icon: Flame,
    earned: true,
    date: "22/04/2026",
  },
  {
    id: 3,
    title: "Quiz trên 80%",
    description: "Đạt điểm quiz trên 80%",
    icon: Trophy,
    earned: true,
    date: "01/05/2026",
  },
  {
    id: 4,
    title: "100 từ vựng",
    description: "Học được 100 từ vựng",
    icon: Medal,
    earned: true,
    date: "10/05/2026",
  },
  {
    id: 5,
    title: "30 ngày streak",
    description: "Học liên tục 30 ngày",
    icon: Flame,
    earned: false,
    date: null,
  },
  {
    id: 6,
    title: "Hoàn thành N5",
    description: "Hoàn thành toàn bộ nội dung N5",
    icon: GraduationCap,
    earned: false,
    date: null,
  },
]

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin và xem thành tích của bạn
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="/avatar.png" alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  NT
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">Nguyễn Văn Tuấn</h2>
              <p className="text-sm text-muted-foreground">tuan22ce089@example.com</p>
              <Badge className="mt-2 bg-primary/10 text-primary">N5 Beginner</Badge>
              
              <Separator className="my-6" />
              
              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lớp</p>
                    <p className="font-medium">22SE1B</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngành</p>
                    <p className="font-medium">Kỹ thuật phần mềm</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mục tiêu</p>
                    <p className="font-medium">Thi JLPT N5</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                    <p className="font-medium">15/04/2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng thời gian học</p>
                    <p className="font-medium">42 giờ 30 phút</p>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6" variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa hồ sơ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress overview */}
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ học tập</CardTitle>
              <CardDescription>Tổng quan tiến độ N5 của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiến độ tổng thể</span>
                  <span className="text-sm text-muted-foreground">68%</span>
                </div>
                <Progress value={68} className="h-3" />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Từ vựng</span>
                    <span className="text-sm font-medium">342/500</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Ngữ pháp</span>
                    <span className="text-sm font-medium">28/45</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Quiz đã làm</span>
                    <span className="text-sm font-medium">45 bài</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">82%</div>
                  <p className="text-xs text-muted-foreground">Điểm trung bình</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Streak hiện tại</span>
                    <Flame className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-accent">7 ngày</div>
                  <p className="text-xs text-muted-foreground">Kỷ lục: 14 ngày</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Thành tích
              </CardTitle>
              <CardDescription>
                Các thành tích bạn đã đạt được
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-4 transition-all ${
                      achievement.earned
                        ? "bg-card"
                        : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          achievement.earned
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <achievement.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.date && (
                          <p className="text-xs text-success mt-1">
                            ✓ {achievement.date}
                          </p>
                        )}
                        {!achievement.earned && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Chưa đạt
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
