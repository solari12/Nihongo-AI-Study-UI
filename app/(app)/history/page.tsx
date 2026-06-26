"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { History, BookOpen, FileText, HelpCircle, RefreshCw, Clock, TrendingUp, BarChart3, LineChart as LineChartIcon, Activity } from "lucide-react"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useActivityLog, type ActivityType, type LearningActivity } from "@/hooks/use-activity-log"

type VocabChartType = "bar" | "line" | "area"

const activitySummaryColors = ["#e96f78", "#d97855", "#b96b8f", "#9d78c8", "#f0a5a9"]

const typeIcons: Record<ActivityType, React.ReactNode> = {
  vocabulary: <BookOpen className="h-4 w-4 text-[#d94f5b]" />,
  vocabulary_session: <BookOpen className="h-4 w-4 text-[#d94f5b]" />,
  grammar: <FileText className="h-4 w-4 text-[#b96b8f]" />,
  grammar_session: <FileText className="h-4 w-4 text-[#b96b8f]" />,
  quiz: <HelpCircle className="h-4 w-4 text-[#d97855]" />,
  review: <RefreshCw className="h-4 w-4 text-[#9d78c8]" />,
}

const typeLabels: Record<ActivityType, string> = {
  vocabulary: "Từ vựng",
  vocabulary_session: "Phiên từ vựng",
  grammar: "Ngữ pháp",
  grammar_session: "Phiên ngữ pháp",
  quiz: "Quiz",
  review: "Ôn tập",
}

const typeBadgeColors: Record<ActivityType, string> = {
  vocabulary: "border border-[#f0c4c0] bg-[#fff0ef] text-[#c94955]",
  vocabulary_session: "border border-[#f0c4c0] bg-[#fff0ef] text-[#c94955]",
  grammar: "border border-[#ead0df] bg-[#fff3f8] text-[#a7557c]",
  grammar_session: "border border-[#ead0df] bg-[#fff3f8] text-[#a7557c]",
  quiz: "border border-[#f3d2bf] bg-[#fff4ed] text-[#c7633f]",
  review: "border border-[#ddd0f0] bg-[#f8f2ff] text-[#8460b0]",
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
  const [vocabChartType, setVocabChartType] = useState<VocabChartType>("bar")

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
      if (activity.type === "vocabulary" || activity.type === "vocabulary_session") {
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

  const activitySummaryData = useMemo(() => {
    const summary = new Map<string, { name: string; value: number }>()

    filteredActivities.forEach((activity) => {
      const type = activity.type as string
      const name =
        type === "vocabulary" || type === "vocabulary_session"
          ? "Từ vựng"
          : type === "grammar" || type === "grammar_session"
            ? "Ngữ pháp"
            : type === "quiz"
              ? "Quiz"
              : type === "review"
                ? "Ôn tập"
                : "Khác"

      summary.set(name, {
        name,
        value: (summary.get(name)?.value ?? 0) + 1,
      })
    })

    return Array.from(summary.values()).filter((item) => item.value > 0)
  }, [filteredActivities])

  return (
    <div className="space-y-6 rounded-3xl border border-[#f3d7d2] bg-[#fff7f6] p-4 shadow-sm md:p-6">
      <div className="rounded-2xl border border-[#f0c4c0] bg-white/85 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#7a3f45]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe7e4]">
            <History className="h-5 w-5 text-[#d94f5b]" />
          </span>
          Lịch sử học tập
        </h1>
        <p className="mt-2 text-sm text-[#8a6665]">
          Theo dõi tiến độ và hoạt động học tập thực tế của bạn
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#7a3f45]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7e4]">
                <Clock className="h-4 w-4 text-[#d94f5b]" />
              </span>
              Thời gian học hằng ngày
            </CardTitle>
            <CardDescription className="text-[#9a7472]">7 ngày gần nhất (phút)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyMinutesData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e96f78" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#e96f78" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d6d3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} phút`, "Thời gian"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#e96f78"
                    strokeWidth={3}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#7a3f45]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0ef]">
                <TrendingUp className="h-4 w-4 text-[#d97855]" />
              </span>
              Điểm quiz
            </CardTitle>
            <CardDescription className="text-[#9a7472]">Xu hướng điểm theo từng lần làm quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d6d3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Điểm"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#d97855"
                    strokeWidth={3}
                    dot={{ fill: "#d97855", stroke: "#fff", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#c85a63", stroke: "#fff", strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#7a3f45]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7e4]">
                <BookOpen className="h-4 w-4 text-[#e96f78]" />
              </span>
              Từ vựng học theo ngày
            </CardTitle>
            <CardDescription className="text-[#9a7472]">Số hoạt động học từ mới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex justify-end">
              <div className="flex rounded-md border border-[#f0c4c0] bg-[#fff7f6] p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={`h-7 w-7 ${vocabChartType === "bar" ? "bg-[#e96f78] text-white hover:bg-[#e96f78] hover:text-white" : "text-[#c85a63] hover:bg-[#ffe7e4] hover:text-[#c85a63]"}`}
                  onClick={() => setVocabChartType("bar")}
                  aria-label="Bar chart"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={`h-7 w-7 ${vocabChartType === "line" ? "bg-[#e96f78] text-white hover:bg-[#e96f78] hover:text-white" : "text-[#c85a63] hover:bg-[#ffe7e4] hover:text-[#c85a63]"}`}
                  onClick={() => setVocabChartType("line")}
                  aria-label="Line chart"
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={`h-7 w-7 ${vocabChartType === "area" ? "bg-[#e96f78] text-white hover:bg-[#e96f78] hover:text-white" : "text-[#c85a63] hover:bg-[#ffe7e4] hover:text-[#c85a63]"}`}
                  onClick={() => setVocabChartType("area")}
                  aria-label="Area chart"
                >
                  <Activity className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                {vocabChartType === "bar" ? (
                <BarChart data={vocabByDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d6d3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} tu`, "So luong"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#e96f78"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
                ) : vocabChartType === "line" ? (
                <LineChart data={vocabByDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d6d3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} tu`, "So luong"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#e96f78"
                    strokeWidth={3}
                    dot={{ fill: "#e96f78", stroke: "#fff", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#d94f5b", stroke: "#fff", strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
                ) : (
                <AreaChart data={vocabByDayData}>
                  <defs>
                    <linearGradient id="colorVocabularyPink" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e96f78" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#e96f78" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d6d3" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} tu`, "So luong"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#e96f78"
                    strokeWidth={3}
                    fill="url(#colorVocabularyPink)"
                  />
                </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-[#7a3f45]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7e4]">
              <Activity className="h-4 w-4 text-[#d94f5b]" />
            </span>
            Tổng hợp hoạt động học tập
          </CardTitle>
          <CardDescription className="text-[#9a7472]">Tỷ lệ các loại hoạt động trong bộ lọc hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid #f0c4c0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [`${value} hoạt động`, name]}
                  />
                  <Pie
                    data={activitySummaryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={96}
                    paddingAngle={4}
                    stroke="#fff7f6"
                    strokeWidth={4}
                  >
                    {activitySummaryData.map((entry, index) => (
                      <Cell key={entry.name} fill={activitySummaryColors[index % activitySummaryColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {activitySummaryData.length ? (
                activitySummaryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-[#f5d6d3] bg-[#fffaf9] px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-[#7a3f45]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: activitySummaryColors[index % activitySummaryColors.length] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold text-[#c94955]">{item.value}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#f0c4c0] bg-[#fffaf9] px-3 py-6 text-center text-sm text-[#9a7472]">
                  Chưa có dữ liệu trong bộ lọc này.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-[#7a3f45]">Lịch sử hoạt động</CardTitle>
              <CardDescription className="text-[#9a7472]">Chi tiết các hoạt động học tập được ghi nhận từ app</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | ActivityType)}>
                <SelectTrigger className="w-[150px] border-[#f0c4c0] bg-[#fff7f6] text-[#7a3f45] focus:ring-[#e96f78]/30">
                  <SelectValue placeholder="Loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="vocabulary">Từ vựng</SelectItem>
                  <SelectItem value="vocabulary_session">Phiên từ vựng</SelectItem>
                  <SelectItem value="grammar">Ngữ pháp</SelectItem>
                  <SelectItem value="grammar_session">Phiên ngữ pháp</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="review">Ôn tập</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[130px] border-[#f0c4c0] bg-[#fff7f6] text-[#7a3f45] focus:ring-[#e96f78]/30">
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
          <div className="overflow-hidden rounded-2xl border border-[#f0c4c0] bg-[#fffaf9]">
            <Table>
              <TableHeader className="bg-[#fff0ef]">
                <TableRow className="border-[#f0c4c0] hover:bg-[#fff0ef]">
                  <TableHead className="text-[#7a3f45]">Ngày</TableHead>
                  <TableHead className="text-[#7a3f45]">Loại</TableHead>
                  <TableHead className="text-[#7a3f45]">Nội dung</TableHead>
                  <TableHead className="text-[#7a3f45]">Kết quả</TableHead>
                  <TableHead className="text-[#7a3f45]">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="border-[#f5d6d3] hover:bg-[#fff4f2]">
                    <TableCell className="font-medium text-[#7a3f45]">{formatDateTime(activity.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={`${typeBadgeColors[activity.type]} rounded-full px-2.5 py-1 shadow-none`}>
                        <span className="mr-1">{typeIcons[activity.type]}</span>
                        {typeLabels[activity.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[520px] text-[#6f5655]">
                      <div className="line-clamp-2 leading-6">{activity.content}</div>
                    </TableCell>
                    <TableCell>
                      <span className={
                        typeof activity.score === "number"
                          ? activity.score >= 80
                            ? "text-[#c94955] font-medium"
                            : "text-[#d97855] font-medium"
                          : "text-[#6f5655]"
                      }>
                        <span className="line-clamp-2">{activity.result ?? "-"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-[#9a7472]">
                      {activity.durationMinutes ? `${activity.durationMinutes} phút` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-[#9a7472]">
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
