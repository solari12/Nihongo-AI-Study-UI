"use client"

import Link from "next/link"
import { StatsCard } from "@/components/app/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  FileText,
  HelpCircle,
  TrendingUp,
  Flame,
  PlayCircle,
  AlertCircle,
  Clock,
  Route,
  Settings2,
  Database,
  ArrowRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useRecommendations } from "@/hooks/use-recommendations"

const weeklyData = [
  { day: "T2", minutes: 45 },
  { day: "T3", minutes: 30 },
  { day: "T4", minutes: 60 },
  { day: "T5", minutes: 25 },
  { day: "T6", minutes: 50 },
  { day: "T7", minutes: 40 },
  { day: "CN", minutes: 55 },
]

const recentActivities = [
  { type: "vocabulary", content: "Học 10 từ vựng mới - Chủ đề: Gia đình", time: "2 giờ trước" },
  { type: "quiz", content: "Hoàn thành quiz ngữ pháp - Điểm: 85%", time: "5 giờ trước" },
  { type: "grammar", content: "Học mẫu câu: N は N です", time: "Hôm qua" },
  { type: "review", content: "Ôn tập 15 từ vựng", time: "Hôm qua" },
]

const weakTopics = [
  { topic: "Động từ nhóm 2", accuracy: 65 },
  { topic: "Trợ từ は và が", accuracy: 58 },
  { topic: "Đếm số", accuracy: 70 },
]

const recommendedLessons = [
  { title: "Từ vựng: Đồ vật trong nhà", type: "vocabulary", duration: "15 phút", targetUrl: "/vocabulary" },
  { title: "Ngữ pháp: N じゃありません", type: "grammar", duration: "20 phút", targetUrl: "/grammar" },
]

const demoSteps = [
  {
    title: "Nhập dữ liệu N5",
    description: "Admin thêm từ vựng, ngữ pháp, quiz hoặc import JSON.",
    href: "/admin",
    icon: Settings2,
  },
  {
    title: "Học và làm quiz",
    description: "Người học đánh dấu tiến độ, làm quiz và tạo activity log.",
    href: "/quiz",
    icon: HelpCircle,
  },
  {
    title: "Xem AI gợi ý",
    description: "BKT + SM-2 xếp hạng nội dung cần học tiếp theo.",
    href: "/learning-path",
    icon: Route,
  },
]

export default function DashboardPage() {
  const { stats } = useStudyProgress()
  const { content } = useAdminContent()
  const { recommendations, activities } = useRecommendations()
  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const completedGrammar = content.grammar.filter((item) => item.status === "Đã hoàn thành").length
  const safeVocabularyTotal = Math.max(totalVocabulary, 1)
  const safeGrammarTotal = Math.max(totalGrammar, 1)
  const n5Progress = Math.round(
    ((stats.learnedVocabulary / safeVocabularyTotal) * 0.45 +
      (completedGrammar / safeGrammarTotal) * 0.35 +
      (stats.latestQuizScore / 100) * 0.2) *
      100
  )

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
            <Badge variant="outline" className="mb-3">
              Demo dashboard học N5
            </Badge>
            <h1 className="text-2xl font-bold">Xin chào, Tuấn!</h1>
            <p className="max-w-2xl text-muted-foreground">
              Đây là màn hình tổng hợp tiến độ, lịch sử học và gợi ý AI. Khi thuyết trình,
              có thể đi theo luồng: Admin nhập dữ liệu, người học làm quiz, sau đó hệ thống đề xuất lộ trình.
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

      <div className="grid gap-4 md:grid-cols-3">
        {demoSteps.map((step) => (
          <Card key={step.title} className="shadow-sm">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{step.title}</p>
              </div>
              <p className="flex-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
              <Button variant="outline" className="justify-between" asChild>
                <Link href={step.href}>
                  Mở bước này
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Từ vựng đã học"
          value={stats.learnedVocabulary}
          subtitle={`/ ${totalVocabulary} từ N5`}
          icon={<BookOpen className="h-5 w-5" />}
          trend={{ value: 12, label: "tuần này", positive: true }}
        />
        <StatsCard
          title="Ngữ pháp đã học"
          value={completedGrammar}
          subtitle={`/ ${totalGrammar} mẫu N5`}
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 8, label: "tuần này", positive: true }}
        />
        <StatsCard
          title="Quiz đã làm"
          value={stats.quizAttempts}
          subtitle="bài kiểm tra"
          icon={<HelpCircle className="h-5 w-5" />}
        />
        <StatsCard
          title="Điểm trung bình"
          value={`${stats.averageQuizScore}%`}
          subtitle="tất cả quiz"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 5, label: "so với tuần trước", positive: true }}
        />
        <StatsCard
          title="Chuỗi ngày học"
          value="7"
          subtitle="ngày liên tục"
          icon={<Flame className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tiến độ học 7 ngày qua
            </CardTitle>
            <CardDescription>Số phút học mỗi ngày</CardDescription>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} phút`, "Thời gian học"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Cần ôn tập
            </CardTitle>
            <CardDescription>Các chủ đề còn yếu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakTopics.map((topic, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{topic.topic}</span>
                  <span className="text-muted-foreground">{topic.accuracy}%</span>
                </div>
                <Progress value={topic.accuracy} className="h-2" />
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/vocabulary">
              Ôn tập ngay
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recommended Lessons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-success" />
              Bài học đề xuất hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recommendations.length ? recommendations.slice(0, 2) : recommendedLessons).map((lesson, index) => (
              <div
                key={"id" in lesson ? lesson.id : index}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {lesson.type === "vocabulary" ? (
                      <BookOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {"estimatedTime" in lesson ? lesson.estimatedTime : lesson.duration}
                    </div>
                    {"reason" in lesson && (
                      <p className="mt-1 text-xs text-muted-foreground">{lesson.reason}</p>
                    )}
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={"targetUrl" in lesson ? lesson.targetUrl : "/learning-path"}>Học ngay</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(activities.length ? activities.slice(0, 4) : recentActivities).map((activity, index) => (
                <div key={"id" in activity ? activity.id : index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={
                        activity.type === "vocabulary"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : activity.type === "quiz"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : activity.type === "grammar"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-purple-100 text-purple-700 border-purple-200"
                      }
                    >
                      {activity.type === "vocabulary"
                        ? "Từ vựng"
                        : activity.type === "quiz"
                        ? "Quiz"
                        : activity.type === "grammar"
                        ? "Ngữ pháp"
                        : "Ôn tập"}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {"createdAt" in activity ? new Date(activity.createdAt).toLocaleString("vi-VN") : activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Checklist demo nhanh
          </CardTitle>
          <CardDescription>Luồng này giúp người xem hiểu rõ dữ liệu đi qua toàn hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {[
            "Admin thêm một từ mới",
            "Mở Vocabulary và đánh dấu đã học",
            "Làm một bài Quiz",
            "Mở Learning Path để xem AI gợi ý",
          ].map((item, index) => (
            <div key={item} className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </div>
              <p className="text-sm font-medium">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
