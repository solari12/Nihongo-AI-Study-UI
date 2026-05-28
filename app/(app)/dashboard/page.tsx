"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, FileText, HelpCircle, TrendingUp } from "lucide-react"
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
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Dashboard học N5
            </Badge>
            <h1 className="text-2xl font-bold">Bắt đầu lộ trình học của bạn</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground/80">
              Dashboard chỉ hiển thị tiến độ thật của tài khoản hiện tại. Nếu bạn vừa tạo tài khoản mới, hãy hoàn tất hồ sơ học tập và placement test trước.
            </p>
          </div>
          <div className="grid min-w-[260px] gap-3 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tiến độ N5 tổng hợp</span>
              <span className="text-3xl font-extrabold tracking-tight text-primary">{n5Progress}%</span>
            </div>
            <Progress value={n5Progress} className="h-1.5" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Từ vựng 45% · Ngữ pháp 35% · Quiz 20%</p>
              <p className="shrink-0 text-[11px] font-medium text-muted-foreground/60">Cold-start {coldStartLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {!hasProgress && (
        <Card className="border-none bg-primary/5 shadow-none">
          <CardHeader>
            <CardTitle>Tài khoản mới chưa có dữ liệu học</CardTitle>
            <CardDescription className="text-muted-foreground/80">
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
          <Card key={step.title} className="border-none bg-muted/40 shadow-none transition-all hover:bg-muted/70">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/70">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
                  )}
                </div>
                <p className="font-semibold">{step.title}</p>
              </div>
              <p className="flex-1 text-sm leading-6 text-muted-foreground/80">{step.description}</p>
              <Link href={step.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Tiếp tục
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Từ vựng đã học"
          value={stats.learnedVocabulary}
          subtitle={`hoàn thành / ${totalVocabulary} từ`}
          icon={<BookOpen className="h-4 w-4" />}
          className="border-none bg-background shadow-none"
          contentClassName="p-4"
          iconClassName="bg-transparent p-0 text-muted-foreground/40"
          valueClassName="text-2xl font-bold tracking-tight"
          subtitleClassName="mt-0.5 text-[12px] text-muted-foreground/60"
        />
        <StatsCard
          title="Ngữ pháp đã học"
          value={completedGrammar}
          subtitle={`hoàn thành / ${totalGrammar} mẫu`}
          icon={<FileText className="h-4 w-4" />}
          className="border-none bg-background shadow-none"
          contentClassName="p-4"
          iconClassName="bg-transparent p-0 text-muted-foreground/40"
          valueClassName="text-2xl font-bold tracking-tight"
          subtitleClassName="mt-0.5 text-[12px] text-muted-foreground/60"
        />
        <StatsCard
          title="Quiz đã làm"
          value={stats.quizAttempts}
          subtitle="bài kiểm tra"
          icon={<HelpCircle className="h-4 w-4" />}
          className="border-none bg-background shadow-none"
          contentClassName="p-4"
          iconClassName="bg-transparent p-0 text-muted-foreground/40"
          valueClassName="text-2xl font-bold tracking-tight"
          subtitleClassName="mt-0.5 text-[12px] text-muted-foreground/60"
        />
        <StatsCard
          title="Điểm trung bình"
          value={`${stats.averageQuizScore}%`}
          subtitle="tất cả quiz"
          icon={<TrendingUp className="h-4 w-4" />}
          className="border-none bg-background shadow-none"
          contentClassName="p-4"
          iconClassName="bg-transparent p-0 text-muted-foreground/40"
          valueClassName="text-2xl font-bold tracking-tight"
          subtitleClassName="mt-0.5 text-[12px] text-muted-foreground/60"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Thời gian học 7 ngày qua
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">Số phút học được ghi từ activity thật của tài khoản.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--muted) / 0.3)" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => [`${value} phút`, "Thời gian học"]} />
                    <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMinutes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-success" />
                Bài học đề xuất hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length ? (
                <div className="divide-y divide-border/40">
                  {recommendations.slice(0, 2).map((lesson) => (
                    <div key={lesson.id} className="-mx-4 flex items-center justify-between gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-muted/30">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground/70">
                          {lesson.type === "vocabulary" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                            <Clock className="h-3 w-3" />
                            {lesson.estimatedTime}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground/70">{lesson.reason}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" asChild>
                        <Link href={lesson.targetUrl}>Học ngay</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/30 p-6 text-sm text-muted-foreground/80">
                  Chưa có gợi ý vì tài khoản chưa có hồ sơ học tập. Hãy bắt đầu bằng onboarding.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length ? (
              <div className="divide-y divide-border/40">
                {activities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="-mx-4 flex items-start gap-3 rounded-lg px-4 py-4 transition-colors hover:bg-muted/30">
                    <Badge variant="outline" className="border-border/60 bg-muted/40 text-muted-foreground">
                      {activityLabel(activity.type)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-6">{activity.content}</p>
                      <p className="text-xs text-muted-foreground/70">{new Date(activity.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/30 p-6 text-sm text-muted-foreground/80">
                Chưa có hoạt động học nào cho tài khoản này.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
