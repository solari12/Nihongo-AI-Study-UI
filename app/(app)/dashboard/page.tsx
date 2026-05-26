"use client"

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
  { title: "Từ vựng: Đồ vật trong nhà", type: "vocabulary", duration: "15 phút" },
  { title: "Ngữ pháp: N じゃありません", type: "grammar", duration: "20 phút" },
]

export default function DashboardPage() {
  const { stats } = useStudyProgress()
  const { content } = useAdminContent()
  const { recommendations, activities } = useRecommendations()
  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const completedGrammar = content.grammar.filter((item) => item.status === "Đã hoàn thành").length
  const n5Progress = Math.round(
    ((stats.learnedVocabulary / totalVocabulary) * 0.45 +
      (completedGrammar / totalGrammar) * 0.35 +
      (stats.latestQuizScore / 100) * 0.2) *
      100
  )

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xin chào, Tuấn! 👋</h1>
          <p className="text-muted-foreground">
            Hôm nay bạn muốn học gì?
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-4xl font-bold text-primary">{n5Progress}%</span>
          <span className="text-sm text-muted-foreground">Tiến độ N5</span>
        </div>
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
            <Button variant="outline" className="w-full mt-4">
              Ôn tập ngay
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
                <Button size="sm">Học ngay</Button>
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
    </div>
  )
}
