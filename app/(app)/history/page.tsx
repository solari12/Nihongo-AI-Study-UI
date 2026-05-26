"use client"

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

const activityHistory = [
  {
    id: 1,
    date: "26/05/2026",
    type: "vocabulary",
    content: "Học 15 từ vựng - Chủ đề: Đồ vật",
    result: "Hoàn thành",
    duration: "25 phút",
  },
  {
    id: 2,
    date: "26/05/2026",
    type: "quiz",
    content: "Quiz từ vựng bài 3",
    result: "85%",
    duration: "12 phút",
  },
  {
    id: 3,
    date: "25/05/2026",
    type: "grammar",
    content: "Học mẫu câu: N じゃありません",
    result: "Hoàn thành",
    duration: "20 phút",
  },
  {
    id: 4,
    date: "25/05/2026",
    type: "review",
    content: "Ôn tập 20 từ vựng cũ",
    result: "18/20 nhớ",
    duration: "15 phút",
  },
  {
    id: 5,
    date: "24/05/2026",
    type: "vocabulary",
    content: "Học 10 từ vựng - Chủ đề: Gia đình",
    result: "Hoàn thành",
    duration: "18 phút",
  },
  {
    id: 6,
    date: "24/05/2026",
    type: "quiz",
    content: "Quiz tổng hợp tuần 3",
    result: "78%",
    duration: "20 phút",
  },
  {
    id: 7,
    date: "23/05/2026",
    type: "grammar",
    content: "Học mẫu câu: これ/それ/あれ",
    result: "Hoàn thành",
    duration: "25 phút",
  },
  {
    id: 8,
    date: "22/05/2026",
    type: "vocabulary",
    content: "Học 12 từ vựng - Chủ đề: Trường học",
    result: "Hoàn thành",
    duration: "22 phút",
  },
]

const dailyMinutesData = [
  { date: "20/05", minutes: 45 },
  { date: "21/05", minutes: 30 },
  { date: "22/05", minutes: 55 },
  { date: "23/05", minutes: 40 },
  { date: "24/05", minutes: 38 },
  { date: "25/05", minutes: 35 },
  { date: "26/05", minutes: 50 },
]

const quizScoreData = [
  { date: "Tuần 1", score: 72 },
  { date: "Tuần 2", score: 75 },
  { date: "Tuần 3", score: 78 },
  { date: "Tuần 4", score: 82 },
  { date: "Tuần 5", score: 80 },
  { date: "Tuần 6", score: 85 },
]

const vocabByWeekData = [
  { week: "T1", count: 35 },
  { week: "T2", count: 42 },
  { week: "T3", count: 38 },
  { week: "T4", count: 50 },
  { week: "T5", count: 45 },
  { week: "T6", count: 52 },
]

const typeIcons: Record<string, React.ReactNode> = {
  vocabulary: <BookOpen className="h-4 w-4 text-primary" />,
  grammar: <FileText className="h-4 w-4 text-success" />,
  quiz: <HelpCircle className="h-4 w-4 text-accent" />,
  review: <RefreshCw className="h-4 w-4 text-purple-500" />,
}

const typeLabels: Record<string, string> = {
  vocabulary: "Từ vựng",
  grammar: "Ngữ pháp",
  quiz: "Quiz",
  review: "Ôn tập",
}

const typeBadgeColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700",
  grammar: "bg-green-100 text-green-700",
  quiz: "bg-orange-100 text-orange-700",
  review: "bg-purple-100 text-purple-700",
}

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Lịch sử học tập
        </h1>
        <p className="text-muted-foreground">
          Theo dõi tiến độ và hoạt động học tập của bạn
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily learning time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Thời gian học hàng ngày
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

        {/* Quiz score trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Điểm quiz theo tuần
            </CardTitle>
            <CardDescription>Xu hướng điểm số (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizScoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[60, 100]} className="text-xs" />
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

        {/* Vocabulary learned by week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Từ vựng học theo tuần
            </CardTitle>
            <CardDescription>Số từ mới học được</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vocabByWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
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

      {/* Activity history table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lịch sử hoạt động</CardTitle>
              <CardDescription>Chi tiết các hoạt động học tập gần đây</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
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
              <Select defaultValue="7days">
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
                {activityHistory.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.date}</TableCell>
                    <TableCell>
                      <Badge className={typeBadgeColors[activity.type]}>
                        <span className="mr-1">{typeIcons[activity.type]}</span>
                        {typeLabels[activity.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.content}</TableCell>
                    <TableCell>
                      <span className={
                        activity.result.includes("%") 
                          ? parseInt(activity.result) >= 80 
                            ? "text-success font-medium" 
                            : "text-accent font-medium"
                          : "text-foreground"
                      }>
                        {activity.result}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.duration}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
