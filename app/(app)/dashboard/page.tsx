"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Clock, Database, FileText, Flame, HelpCircle, PlayCircle, TrendingUp } from "lucide-react"
import { StatsCard } from "@/components/app/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { useRecommendations } from "@/hooks/use-recommendations"
import { useStudyProgress } from "@/hooks/use-study-progress"

const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

function buildWeeklyData(activities: ReturnType<typeof useActivityLog>["activities"]) {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const minutes = activities.reduce((total, activity) => {
      const createdAt = new Date(activity.createdAt)
      if (createdAt >= dayStart && createdAt <= dayEnd) {
        return total + (activity.durationMinutes ?? 0)
      }
      return total
    }, 0)

    return {
      day: weekdayLabels[date.getDay()],
      minutes,
    }
  })
}

function activityLabel(type: string) {
  if (type === "vocabulary") return "Từ vựng"
  if (type === "grammar") return "Ngữ pháp"
  if (type === "quiz") return "Quiz"
  return "Ôn tập"
}

export default function DashboardPage() {
  const { stats } = useStudyProgress()
  const { content } = useAdminContent()
  const { recommendations } = useRecommendations()
  const { activities } = useActivityLog()
  const { profile, placement } = useLearnerProfile()

  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const completedGrammar = 0
  const safeVocabularyTotal = Math.max(totalVocabulary, 1)
  const safeGrammarTotal = Math.max(totalGrammar, 1)
  const n5Progress = Math.round(
    ((stats.learnedVocabulary / safeVocabularyTotal) * 0.45 +
      (completedGrammar / safeGrammarTotal) * 0.35 +
      (stats.latestQuizScore / 100) * 0.2) *
      100
  )
  const weeklyData = buildWeeklyData(activities)
  const hasActivity = activities.length > 0
  const hasProgress = stats.learnedVocabulary > 0 || stats.quizAttempts > 0 || hasActivity
  const coldStartLabel = profile.completedOnboarding
    ? `${profile.coldStartScore}/100`
    : "Chưa có"

  const nextSteps = [
    {
      title: "Khởi tạo hồ sơ học tập",
      description: profile.completedOnboarding
        ? `Đã tạo cold-start point ${profile.coldStartScore}/100.`
        : "Tài khoản mới cần mục tiêu, trình độ kana và thời gian học để tạo cold-start point.",
      href: "/onboarding",
      done: profile.completedOnboarding,
    },
    {
      title: "Làm kiểm tra đầu vào",
      description: placement.completed
        ? `Đã hoàn tất placement test với ${placement.percentage}%.`
        : "Xác định bạn nên bắt đầu từ kana, từ vựng nền tảng hay ôn tập N5.",
      href: "/placement-test",
      done: placement.completed,
    },
    {
      title: "Xem AI gợi ý",
      description: "BKT + SM-2 + cold-start point xếp hạng nội dung cần học tiếp theo.",
      href: "/learning-path",
      done: hasProgress,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Dashboard học N5
            </Badge>
            <h1 className="text-2xl font-bold">Bắt đầu lộ trình học của bạn</h1>
            <p className="max-w-2xl text-muted-foreground">
              Dashboard chỉ hiển thị tiến độ thật của tài khoản hiện tại. Nếu bạn vừa tạo tài khoản mới, hãy hoàn tất hồ sơ học tập và placement test trước.
            </p>
          </div>
          <div className="grid min-w-[260px] gap-2 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tiến độ N5 tổng hợp</span>
              <span className="text-2xl font-bold text-primary">{n5Progress}%</span>
            </div>
            <Progress value={n5Progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Từ vựng 45% · Ngữ pháp 35% · Quiz 20%</p>
          </div>
        </div>
      </div>

      {!hasProgress && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Tài khoản mới chưa có dữ liệu học</CardTitle>
            <CardDescription>
              Đây là trạng thái đúng cho user mới. Hệ thống sẽ tạo gợi ý ban đầu từ onboarding và placement test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={profile.completedOnboarding ? "/placement-test" : "/onboarding"}>
                {profile.completedOnboarding ? "Làm kiểm tra đầu vào" : "Tạo hồ sơ học tập"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {nextSteps.map((step) => (
          <Card key={step.title} className="shadow-sm">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {step.done ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                </div>
                <p className="font-semibold">{step.title}</p>
              </div>
              <p className="flex-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
              <Button variant="outline" className="justify-between" asChild>
                <Link href={step.href}>
                  {step.done ? "Xem lại" : "Mở bước này"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Từ vựng đã học" value={stats.learnedVocabulary} subtitle={`/ ${totalVocabulary} từ N5`} icon={<BookOpen className="h-5 w-5" />} />
        <StatsCard title="Ngữ pháp đã học" value={completedGrammar} subtitle={`/ ${totalGrammar} mẫu N5`} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Quiz đã làm" value={stats.quizAttempts} subtitle="bài kiểm tra" icon={<HelpCircle className="h-5 w-5" />} />
        <StatsCard title="Điểm trung bình" value={`${stats.averageQuizScore}%`} subtitle="tất cả quiz" icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Cold-start point" value={coldStartLabel} subtitle="điểm khởi tạo" icon={<Flame className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Thời gian học 7 ngày qua
            </CardTitle>
            <CardDescription>Số phút học được ghi từ activity thật của tài khoản.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => [`${value} phút`, "Thời gian học"]} />
                  <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Dữ liệu hiện tại
            </CardTitle>
            <CardDescription>Dữ liệu này lấy theo tài khoản đang đăng nhập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg border p-3">
              <span>Onboarding</span>
              <Badge variant={profile.completedOnboarding ? "default" : "outline"}>{profile.completedOnboarding ? "Đã có" : "Chưa có"}</Badge>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Placement test</span>
              <Badge variant={placement.completed ? "default" : "outline"}>{placement.completed ? `${placement.percentage}%` : "Chưa làm"}</Badge>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Activity log</span>
              <Badge variant="outline">{activities.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-success" />
              Bài học đề xuất hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length ? (
              recommendations.slice(0, 2).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {lesson.type === "vocabulary" ? <BookOpen className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {lesson.estimatedTime}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{lesson.reason}</p>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={lesson.targetUrl}>Học ngay</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có gợi ý vì tài khoản chưa có hồ sơ học tập. Hãy bắt đầu bằng onboarding.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length ? (
              <div className="space-y-4">
                {activities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Badge variant="outline">{activityLabel(activity.type)}</Badge>
                    <div className="flex-1">
                      <p className="text-sm">{activity.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có hoạt động học nào cho tài khoản này.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
