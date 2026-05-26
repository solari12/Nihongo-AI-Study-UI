"use client"

import { LearningPathTimeline } from "@/components/app/learning-path-timeline"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Clock, TrendingUp, BookOpen, FileText, HelpCircle, RefreshCw } from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"

const learningSteps = [
  {
    id: "1",
    title: "Ôn tập từ vựng: Gia đình",
    type: "review" as const,
    status: "completed" as const,
    reason: "Đã lâu không ôn tập chủ đề này",
    estimatedTime: "10 phút",
  },
  {
    id: "2",
    title: "Học ngữ pháp: N じゃありません",
    type: "grammar" as const,
    status: "completed" as const,
    reason: "Tiếp theo trong lộ trình N5",
    estimatedTime: "15 phút",
  },
  {
    id: "3",
    title: "Từ vựng mới: Đồ vật trong nhà",
    type: "vocabulary" as const,
    status: "current" as const,
    reason: "Phù hợp với tiến độ hiện tại",
    estimatedTime: "20 phút",
  },
  {
    id: "4",
    title: "Quiz: Từ vựng + Ngữ pháp bài 3",
    type: "quiz" as const,
    status: "upcoming" as const,
    reason: "Kiểm tra kiến thức đã học",
    estimatedTime: "10 phút",
  },
  {
    id: "5",
    title: "Học ngữ pháp: 〜ます / 〜ません",
    type: "grammar" as const,
    status: "upcoming" as const,
    reason: "Chuẩn bị cho bài tiếp theo",
    estimatedTime: "20 phút",
  },
  {
    id: "6",
    title: "Ôn tập tổng hợp tuần",
    type: "review" as const,
    status: "upcoming" as const,
    reason: "Củng cố kiến thức tuần này",
    estimatedTime: "25 phút",
  },
]

const skillData = [
  { subject: "Từ vựng", A: 75, fullMark: 100 },
  { subject: "Ngữ pháp", A: 68, fullMark: 100 },
  { subject: "Đọc hiểu", A: 60, fullMark: 100 },
  { subject: "Ghi nhớ", A: 82, fullMark: 100 },
  { subject: "Quiz", A: 78, fullMark: 100 },
]

const strengths = [
  "Ghi nhớ từ vựng tốt",
  "Hoàn thành bài tập đúng giờ",
  "Điểm quiz cao ổn định",
]

const weaknesses = [
  "Động từ nhóm 2 còn yếu",
  "Phân biệt trợ từ は và が",
  "Ngữ pháp phức tạp cần ôn thêm",
]

export default function LearningPathPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lộ trình học dành riêng cho bạn</h1>
          <p className="text-muted-foreground">
            Được cá nhân hóa dựa trên tiến độ và kết quả học tập của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            <Target className="mr-1 h-3 w-3" />
            N5 Beginner
          </Badge>
          <Badge className="bg-primary/10 text-primary text-sm py-1.5 px-3">
            Mục tiêu: 8 tuần
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Kế hoạch học hôm nay
              </CardTitle>
              <CardDescription>
                Các bước học được đề xuất dựa trên phân tích AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LearningPathTimeline steps={learningSteps} />
            </CardContent>
          </Card>

          {/* Weekly suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Gợi ý tuần này</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-medium">Từ vựng</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Học thêm 30 từ mới về chủ đề Thời gian và Số đếm
                  </p>
                  <Progress value={40} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">12/30 từ</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-success" />
                    <span className="font-medium">Ngữ pháp</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Hoàn thành 3 mẫu ngữ pháp về thể ます
                  </p>
                  <Progress value={33} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">1/3 mẫu</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium">Quiz</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Làm 5 bài quiz để củng cố kiến thức
                  </p>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">3/5 bài</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Ôn tập</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ôn lại 50 từ vựng và 5 mẫu ngữ pháp cũ
                  </p>
                  <Progress value={20} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">10/50 từ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Skill chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Biểu đồ kỹ năng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Kỹ năng"
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-success">💪 Điểm mạnh</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-success">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-accent">📌 Cần cải thiện</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weaknesses.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-accent">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
