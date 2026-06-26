"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Flame,
  GraduationCap,
  Mail,
  Medal,
  Pencil,
  Star,
  Target,
  Trophy,
  User,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAuth } from "@/hooks/use-auth"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { useRecommendations } from "@/hooks/use-recommendations"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { buildStudyStreak } from "@/lib/activity/streak"
import { grammarData } from "@/lib/data/nihongo-study"
import { getCompletedGrammarPatternsFromActivities } from "@/lib/grammar/progress"

function initials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(-2)
    .toUpperCase()
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) return `${remainingMinutes} phút`
  return `${hours} giờ ${remainingMinutes} phút`
}

export default function ProfilePage() {
  const { activeUser, isLoaded: isAuthLoaded } = useAuth()
  const { stats, isLoaded: isProgressLoaded } = useStudyProgress()
  const { activities, isLoaded: isActivityLoaded } = useActivityLog()
  const { profile, placement, isLoaded: isProfileLoaded } = useLearnerProfile()
  const { recommendations } = useRecommendations()
  const topRecommendation = recommendations[0]
  const isPageLoaded = isAuthLoaded && isProfileLoaded && isProgressLoaded && isActivityLoaded

  const totalMinutes = useMemo(
    () => activities.reduce((total, activity) => total + (activity.durationMinutes ?? 0), 0),
    [activities]
  )
  const studyStreak = useMemo(() => buildStudyStreak(activities), [activities])
  const completedGrammarCount = Math.max(
    stats.completedGrammar,
    getCompletedGrammarPatternsFromActivities(activities, grammarData).size
  )
  const totalProgress = Math.round(
    ((stats.learnedVocabulary / Math.max(stats.totalVocabulary, 1)) * 0.45 +
      (completedGrammarCount / Math.max(stats.totalGrammar, 1)) * 0.35 +
      (stats.averageQuizScore / 100) * 0.2) *
      100
  )

  const achievements = [
    {
      id: 1,
      title: "Bài học đầu tiên",
      description: "Ghi nhận hoạt động học đầu tiên",
      icon: Star,
      earned: activities.length > 0,
    },
    {
      id: 2,
      title: "7 ngày streak",
      description: "Học liên tục 7 ngày",
      icon: Flame,
      earned: studyStreak >= 7,
    },
    {
      id: 3,
      title: "Quiz trên 80%",
      description: "Đạt điểm quiz trên 80%",
      icon: Trophy,
      earned: stats.averageQuizScore >= 80 && stats.quizAttempts > 0,
    },
    {
      id: 4,
      title: "100 từ vựng",
      description: "Học được 100 từ vựng",
      icon: Medal,
      earned: stats.learnedVocabulary >= 100,
    },
    {
      id: 5,
      title: "30 ngày streak",
      description: "Học liên tục 30 ngày",
      icon: Flame,
      earned: studyStreak >= 30,
    },
    {
      id: 6,
      title: "Hoàn thành N5",
      description: "Hoàn thành toàn bộ nội dung N5",
      icon: GraduationCap,
      earned: totalProgress >= 100,
    },
  ]

  if (!isPageLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Spinner className="h-4 w-4" />
          <span>Đang tải hồ sơ học tập...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin và xem thành tích thật của tài khoản này</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 h-24 w-24">
                <AvatarImage src="/avatar.png" alt="Avatar" />
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  {initials(activeUser?.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{activeUser?.name ?? "Người học mới"}</h2>
              <p className="text-sm text-muted-foreground">{activeUser?.email ?? "Chưa có email"}</p>
              <Badge className="mt-2 bg-primary/10 text-primary">
                {placement.completed ? placement.level.replaceAll("_", " ") : "New learner"}
              </Badge>

              <Separator className="my-6" />

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Trình độ</p>
                    <p className="font-medium">{placement.completed ? placement.level.replaceAll("_", " ") : "Chưa kiểm tra"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vai trò</p>
                    <p className="font-medium">{activeUser?.role === "admin" ? "Admin" : "Learner"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mục tiêu</p>
                    <p className="font-medium">{profile.completedOnboarding ? profile.goal.replaceAll("_", " ") : "Chưa thiết lập"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{activeUser?.email ?? "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hoạt động đã ghi nhận</p>
                    <p className="font-medium">{activities.length} hoạt động</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng thời gian học</p>
                    <p className="font-medium">{formatMinutes(totalMinutes)}</p>
                  </div>
                </div>
              </div>

              <Button className="mt-6 w-full" variant="outline" asChild>
                <Link href="/onboarding">
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa hồ sơ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hồ sơ học</CardTitle>
                <CardDescription>Dữ liệu từ onboarding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Mục tiêu:</span> {profile.completedOnboarding ? profile.goal.replaceAll("_", " ") : "Chưa thiết lập"}</p>
                <p><span className="text-muted-foreground">Kana:</span> {profile.completedOnboarding ? profile.kanaLevel.replaceAll("_", " ") : "Chưa thiết lập"}</p>
                <p><span className="text-muted-foreground">Thời lượng:</span> {profile.completedOnboarding ? `${profile.dailyMinutes} phút/ngày` : "Chưa thiết lập"}</p>
                <p><span className="text-muted-foreground">Chủ đề:</span> {profile.preferredTopics.length ? profile.preferredTopics.join(", ") : "Chưa chọn"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Placement</CardTitle>
                <CardDescription>Dữ liệu kiểm tra đầu vào</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Trạng thái:</span> {placement.completed ? "Đã hoàn thành" : "Chưa làm"}</p>
                <p><span className="text-muted-foreground">Điểm:</span> {placement.completed ? `${placement.score}/${placement.total} (${placement.percentage}%)` : "-"}</p>
                <p><span className="text-muted-foreground">Điểm yếu:</span> {placement.weakAreas.length ? placement.weakAreas.join(", ") : "Chưa ghi nhận"}</p>
                <p><span className="text-muted-foreground">Bắt đầu:</span> {placement.completed ? placement.recommendedStart : "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI gợi ý</CardTitle>
                <CardDescription>Từ recommendation engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{topRecommendation?.title ?? "Chưa có gợi ý"}</p>
                <p><span className="text-muted-foreground">Mastery:</span> {topRecommendation ? `${topRecommendation.masteryScore}/100` : "-"}</p>
                <p><span className="text-muted-foreground">Mức cần hỗ trợ:</span> {topRecommendation ? `${topRecommendation.riskScore}/100` : "-"}</p>
                <p className="text-muted-foreground">{topRecommendation?.action ?? "Hoàn tất hồ sơ hoặc làm quiz để tạo dữ liệu gợi ý."}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tiến độ học tập</CardTitle>
              <CardDescription>Tổng quan tiến độ thật của tài khoản hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiến độ tổng thể</span>
                  <span className="text-sm text-muted-foreground">{totalProgress}%</span>
                </div>
                <Progress value={totalProgress} className="h-3" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Từ vựng</span>
                    <span className="text-sm font-medium">
                      {stats.learnedVocabulary}/{stats.totalVocabulary}
                    </span>
                  </div>
                  <Progress value={(stats.learnedVocabulary / Math.max(stats.totalVocabulary, 1)) * 100} className="h-2" />
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Ngữ pháp</span>
                    <span className="text-sm font-medium">
                      {completedGrammarCount}/{stats.totalGrammar}
                    </span>
                  </div>
                  <Progress value={(completedGrammarCount / Math.max(stats.totalGrammar, 1)) * 100} className="h-2" />
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Quiz đã làm</span>
                    <span className="text-sm font-medium">{stats.quizAttempts} bài</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">{stats.averageQuizScore}%</div>
                  <p className="text-xs text-muted-foreground">Điểm trung bình</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">Streak hiện tại</span>
                    <Flame className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-accent">{studyStreak} ngày</div>
                  <p className="text-xs text-muted-foreground">Tính từ hoạt động học đã ghi nhận</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Thành tích
              </CardTitle>
              <CardDescription>Thành tích chỉ mở khóa khi có dữ liệu học thật</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-4 transition-all ${
                      achievement.earned ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          achievement.earned ? "bg-yellow-100 text-yellow-600" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <achievement.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        <p className={achievement.earned ? "mt-1 text-xs text-success" : "mt-1 text-xs text-muted-foreground"}>
                          {achievement.earned ? "Đã đạt" : "Chưa đạt"}
                        </p>
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
