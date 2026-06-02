"use client"

import { LearningPathTimeline } from "@/components/app/learning-path-timeline"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Clock, TrendingUp, BookOpen, FileText, HelpCircle, RefreshCw, Brain, Gauge, ListChecks } from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useRecommendations } from "@/hooks/use-recommendations"

const learningSteps = [
  {
    id: "1",
    title: "Ôn tập từ vựng: Gia đình",
    type: "review" as const,
    status: "completed" as const,
    reason: "Đã lâu không ôn tập chủ đề này",
    estimatedTime: "10 phút",
    targetUrl: "/vocabulary",
  },
  {
    id: "2",
    title: "Học ngữ pháp: N じゃありません",
    type: "grammar" as const,
    status: "completed" as const,
    reason: "Tiếp theo trong lộ trình N5",
    estimatedTime: "15 phút",
    targetUrl: "/grammar",
  },
  {
    id: "3",
    title: "Từ vựng mới: Đồ vật trong nhà",
    type: "vocabulary" as const,
    status: "current" as const,
    reason: "Phù hợp với tiến độ hiện tại",
    estimatedTime: "20 phút",
    targetUrl: "/vocabulary",
  },
  {
    id: "4",
    title: "Quiz: Từ vựng + Ngữ pháp bài 3",
    type: "quiz" as const,
    status: "upcoming" as const,
    reason: "Kiểm tra kiến thức đã học",
    estimatedTime: "10 phút",
    targetUrl: "/quiz",
  },
  {
    id: "5",
    title: "Học ngữ pháp: 〜ます / 〜ません",
    type: "grammar" as const,
    status: "upcoming" as const,
    reason: "Chuẩn bị cho bài tiếp theo",
    estimatedTime: "20 phút",
    targetUrl: "/grammar",
  },
  {
    id: "6",
    title: "Ôn tập tổng hợp tuần",
    type: "review" as const,
    status: "upcoming" as const,
    reason: "Củng cố kiến thức tuần này",
    estimatedTime: "25 phút",
    targetUrl: "/vocabulary",
  },
]

const skillData = [
  { subject: "Từ vựng", A: 75, fullMark: 100 },
  { subject: "Ngữ pháp", A: 68, fullMark: 100 },
  { subject: "Đọc hiểu", A: 60, fullMark: 100 },
  { subject: "Ghi nhớ", A: 82, fullMark: 100 },
  { subject: "Quiz", A: 78, fullMark: 100 },
]

export default function LearningPathPage() {
  const { stats } = useStudyProgress()
  const { content } = useAdminContent()
  const { recommendations } = useRecommendations()
  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const completedGrammar = stats.completedGrammar
  const vocabularyProgress = Math.round((stats.learnedVocabulary / totalVocabulary) * 100)
  const grammarProgress = Math.round((completedGrammar / totalGrammar) * 100)
  const hasLearningData = stats.learnedVocabulary > 0 || completedGrammar > 0 || stats.quizAttempts > 0
  const personalizedSteps = learningSteps.map((step) => {
    const status = hasLearningData ? step.status : step.id === "1" ? "current" as const : "upcoming" as const

    if (step.id === "1") {
      return {
        ...step,
        status,
        title: "Hoàn tất hồ sơ học tập",
        reason: "Giúp hệ thống hiểu mục tiêu và thời gian học của bạn",
        estimatedTime: "2 phút",
        targetUrl: "/onboarding",
      }
    }

    if (step.id === "2") {
      return {
        ...step,
        status,
        title: "Làm placement test",
        reason: "Xác định điểm bắt đầu phù hợp trước khi học",
        estimatedTime: "5 phút",
        targetUrl: "/placement-test",
      }
    }

    if (step.id === "3") {
      return {
        ...step,
        status,
        title: `Từ vựng mới: ${totalVocabulary - stats.learnedVocabulary} từ chưa học`,
        reason: "Dựa trên số từ bạn đã đánh dấu hoàn thành",
      }
    }

    if (step.id === "4") {
      return {
        ...step,
        status,
        title: `Quiz: củng cố kiến thức N5 (${stats.latestQuizScore || "chưa có"}%)`,
        reason: stats.quizAttempts
          ? "Dựa trên kết quả quiz gần nhất"
          : "Làm quiz đầu tiên để hệ thống có dữ liệu gợi ý",
      }
    }

    return { ...step, status }
  })
  const skillSnapshot = [
    { subject: "Từ vựng", A: vocabularyProgress, fullMark: 100 },
    { subject: "Ngữ pháp", A: grammarProgress, fullMark: 100 },
    { subject: "Đọc hiểu", A: 0, fullMark: 100 },
    { subject: "Ghi nhớ", A: vocabularyProgress, fullMark: 100 },
    { subject: "Quiz", A: stats.averageQuizScore, fullMark: 100 },
  ]
  const strengths = hasLearningData
    ? [
        stats.learnedVocabulary > 0 ? `Đã học ${stats.learnedVocabulary} từ vựng` : null,
        stats.quizAttempts > 0 ? `Đã làm ${stats.quizAttempts} quiz` : null,
        stats.averageQuizScore >= 80 ? "Điểm quiz trung bình trên 80%" : null,
      ].filter(Boolean)
    : []
  const weaknesses = hasLearningData
    ? [
        stats.reviewVocabulary > 0 ? `${stats.reviewVocabulary} từ đang cần ôn` : null,
        stats.quizAttempts === 0 ? "Chưa có điểm quiz để đánh giá kỹ năng" : null,
        completedGrammar === 0 ? "Chưa ghi nhận ngữ pháp đã hoàn thành" : null,
      ].filter(Boolean)
    : ["Chưa có dữ liệu học tập. Hãy làm hồ sơ, placement test hoặc học bài đầu tiên để hệ thống đánh giá."]
  const recommendationSteps = recommendations.slice(0, 6).map((recommendation, index) => ({
    id: recommendation.id,
    title: recommendation.title,
    type: recommendation.type,
    status: index === 0 ? "current" as const : "upcoming" as const,
    reason: `${recommendation.reason} Ưu tiên ${recommendation.priority}/100.`,
    estimatedTime: recommendation.estimatedTime,
    targetUrl: recommendation.targetUrl,
  }))
  const topRecommendation = recommendations[0]

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              Thuật toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>BKT ước lượng mức nắm kiến thức từ điểm quiz.</p>
            <p>SM-2 ưu tiên nội dung cần ôn để giảm quên.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-5 w-5 text-amber-600" />
              Ưu tiên cao nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{topRecommendation?.title || "Làm quiz đầu tiên để tạo dữ liệu"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {topRecommendation
                ? `${topRecommendation.priority}/100 điểm ưu tiên`
                : "Hệ thống sẽ cập nhật sau khi có activity log."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-5 w-5 text-success" />
              Dữ liệu đầu vào
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{stats.learnedVocabulary}/{totalVocabulary} từ đã học</p>
            <p>{completedGrammar}/{totalGrammar} mẫu ngữ pháp hoàn thành</p>
            <p>{stats.quizAttempts} lượt quiz đã ghi nhận</p>
          </CardContent>
        </Card>
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
                Các bước học được sắp xếp theo điểm ưu tiên từ hệ khuyến nghị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LearningPathTimeline steps={recommendationSteps.length ? recommendationSteps : personalizedSteps} />
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
                  <Progress value={vocabularyProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.learnedVocabulary}/{totalVocabulary} từ
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-success" />
                    <span className="font-medium">Ngữ pháp</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Hoàn thành 3 mẫu ngữ pháp về thể ます
                  </p>
                  <Progress value={grammarProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedGrammar}/{totalGrammar} mẫu
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium">Quiz</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Làm 5 bài quiz để củng cố kiến thức
                  </p>
                  <Progress value={stats.averageQuizScore || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.quizAttempts} bài đã làm
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Ôn tập</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ôn lại 50 từ vựng và 5 mẫu ngữ pháp cũ
                  </p>
                  <Progress value={Math.min(100, stats.reviewVocabulary * 20)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.reviewVocabulary} từ cần ôn
                  </p>
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
                  <RadarChart data={skillSnapshot}>
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
              <CardTitle className="text-base text-success">Điểm mạnh</CardTitle>
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
              <CardTitle className="text-base text-accent">Cần cải thiện</CardTitle>
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
