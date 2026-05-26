"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, BookOpen, FileText, HelpCircle, RefreshCw, Clock, TrendingUp } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"
import { useActivityLog, type ActivityType, type LearningActivity } from "@/hooks/use-activity-log"

const typeIcons: Record<ActivityType, React.ReactNode> = {
  vocabulary: <BookOpen className="h-4 w-4 text-primary" />,
  grammar: <FileText className="h-4 w-4 text-success" />,
  quiz: <HelpCircle className="h-4 w-4 text-accent" />,
  review: <RefreshCw className="h-4 w-4 text-purple-500" />,
}

const typeLabels: Record<ActivityType, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  quiz: "Quiz",
  review: "Ôn tập",
}

const typeBadgeColors: Record<ActivityType, string> = {
  vocabulary: "bg-blue-100 text-blue-700",
  grammar: "bg-green-100 text-green-700",
  quiz: "bg-orange-100 text-orange-700",
  review: "bg-purple-100 text-purple-700",
}

function isWithinRange(activity: LearningActivity, range: string) {
  if (range === "all") return true

  const days = range === "30days" ? 30 : 7
  const createdAt = new Date(activity.createdAt).getTime()
  const boundary = Date.now() - days * 24 * 60 * 60 * 1000
  return createdAt >= boundary
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function buildLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return {
      key: date.toISOString().slice(0, 10),
      date: formatDate(date.toISOString()),
      minutes: 0,
      vocabulary: 0,
    }
  })
}

export default function HistoryPage() {
  const { activities } = useActivityLog()
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all")
  const [timeFilter, setTimeFilter] = useState("7days")

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesType = typeFilter === "all" || activity.type === typeFilter
      return matchesType && isWithinRange(activity, timeFilter)
    })
  }, [activities, timeFilter, typeFilter])

  const dailyMinutesData = useMemo(() => {
    const days = buildLastSevenDays()
    const dayMap = new Map(days.map((day) => [day.key, day]))

    activities.forEach((activity) => {
      const key = activity.createdAt.slice(0, 10)
      const day = dayMap.get(key)
      if (!day) return

      day.minutes += activity.durationMinutes ?? 0
      if (activity.type === "vocabulary") {
        day.vocabulary += 1
      }
    })

    return days
  }, [activities])

  const quizScoreData = useMemo(() => {
    return activities
      .filter((activity) => activity.type === "quiz" && typeof activity.score === "number")
      .slice()
      .reverse()
      .map((activity, index) => ({
        date: `Lần ${index + 1}`,
        score: activity.score ?? 0,
      }))
  }, [activities])

  const vocabByDayData = dailyMinutesData.map((item) => ({
    date: item.date,
    count: item.vocabulary,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Lịch sử học tập
        </h1>
        <p className="text-muted-foreground">
          Theo dõi tiến độ và hoạt động học tập thực tế của bạn
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Thời gian học hằng ngày
            </CardTitle>
            <CardDescription>7 ngày gần nhất (phút)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyMinutesData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} phút`, "Thời gian"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Điểm quiz
            </CardTitle>
            <CardDescription>Xu hướng điểm theo từng lần làm quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizScoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Điểm"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Từ vựng học theo ngày
            </CardTitle>
            <CardDescription>Số hoạt động học từ mới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vocabByDayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} từ`, "Số lượng"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lịch sử hoạt động</CardTitle>
              <CardDescription>Chi tiết các hoạt động học tập được ghi nhận từ app</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | ActivityType)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="vocabulary">Từ vựng</SelectItem>
                  <SelectItem value="grammar">Ngữ pháp</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="review">Ôn tập</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 ngày</SelectItem>
                  <SelectItem value="30days">30 ngày</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{formatDateTime(activity.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={typeBadgeColors[activity.type]}>
                        <span className="mr-1">{typeIcons[activity.type]}</span>
                        {typeLabels[activity.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.content}</TableCell>
                    <TableCell>
                      <span className={
                        typeof activity.score === "number"
                          ? activity.score >= 80
                            ? "text-success font-medium"
                            : "text-accent font-medium"
                          : "text-foreground"
                      }>
                        {activity.result ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.durationMinutes ? `${activity.durationMinutes} phút` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Chưa có hoạt động phù hợp. Hãy học từ vựng hoặc làm quiz để tạo lịch sử.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
