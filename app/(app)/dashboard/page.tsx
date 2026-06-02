"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, FileText, TrendingUp } from "lucide-react"
import { StatsCard } from "@/components/app/stats-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useActivityLog } from "@/hooks/use-activity-log"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useLearnerProfile } from "@/hooks/use-learner-profile"
import { useRecommendations } from "@/hooks/use-recommendations"
import { useStudyProgress } from "@/hooks/use-study-progress"

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const actionCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/image-removebg-preview.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

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
  const completedGrammar = stats.completedGrammar
  const safeVocabularyTotal = Math.max(totalVocabulary, 1)
  const safeGrammarTotal = Math.max(totalGrammar, 1)
  const n5Progress = Math.round(
    ((stats.learnedVocabulary / safeVocabularyTotal) * 0.45 +
      (completedGrammar / safeGrammarTotal) * 0.35 +
      (stats.latestQuizScore / 100) * 0.2) *
      100
  )
  const hasActivity = activities.length > 0
  const hasProgress = stats.learnedVocabulary > 0 || stats.completedGrammar > 0 || stats.quizAttempts > 0 || hasActivity
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
      actionLabel: profile.completedOnboarding ? "Xem hồ sơ" : "Hoàn tất hồ sơ ngay",
      done: profile.completedOnboarding,
    },
    {
      title: "Làm kiểm tra đầu vào",
      description: placement.completed
        ? `Đã hoàn tất placement test với ${placement.percentage}%.`
        : "Xác định bạn nên bắt đầu từ kana, từ vựng nền tảng hay ôn tập N5.",
      href: "/placement-test",
      actionLabel: placement.completed ? "Xem kết quả" : "Bắt đầu kiểm tra",
      done: placement.completed,
    },
    {
      title: "Xem AI gợi ý",
      description: "BKT + SM-2 + cold-start point xếp hạng nội dung cần học tiếp theo.",
      href: "/learning-path",
      actionLabel: "Xem gợi ý AI",
      done: hasProgress,
    },
  ]

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(255,230,222,0.7),transparent_26%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_48%,#f7d9d2_100%)] p-6">
      <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-[#fff8f1]/80 px-4 pb-4 pt-2">
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_220px] lg:items-center">
          <div className="relative flex h-56 items-end justify-center overflow-visible">
            <Image
              src="/assets/hero-torii.png"
              alt="Minh họa cổng torii và sách học tiếng Nhật"
              width={520}
              height={320}
              priority
              className="h-56 w-full object-contain object-left-bottom"
            />
          </div>

          <div className="pb-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Bắt đầu lộ trình học của bạn</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#4f403b]">
              Dashboard chỉ hiển thị tiến độ tài khoản hiện tại. Nếu bạn vừa tạo tài khoản mới, hãy hoàn tất hồ sơ học tập và placement test trước.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[220px]">
            <div className="relative mx-auto h-40 w-40">
              <Image
                src="/assets/Flower.png"
                alt=""
                width={180}
                height={180}
                aria-hidden="true"
                className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(143,71,66,0.18)]"
              />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div className="max-w-24">
                  <p className="text-xs font-medium leading-4 text-[#6f5952]">Tiến độ N5 tổng hợp</p>
                  <p className="text-4xl font-semibold tracking-tight text-[#1f1a18]">{n5Progress}%</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase text-[#1f1a18]">
              <span>Từ vựng<br />45%</span>
              <span>Ngữ pháp<br />35%</span>
              <span>Quiz<br />20%</span>
            </div>
            <p className="mt-2 text-center text-[11px] font-medium text-[#8f4742]">Cold-start {coldStartLabel}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {nextSteps.map((step) => (
            <Card key={step.title} className="min-h-32 border-none bg-transparent shadow-none drop-shadow-[0_8px_10px_rgba(87,42,34,0.18)] transition-all hover:-translate-y-0.5 hover:drop-shadow-[0_12px_14px_rgba(87,42,34,0.22)]" style={actionCardStyle}>
              <CardContent className="flex h-full items-center gap-4 px-8 py-5">
                <div className={step.done ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c8ead6]" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3c8bd]/60"}>
                  {step.done ? (
                    <CheckCircle2 className="h-6 w-6 text-[#3f9b68]" />
                  ) : (
                    <Circle className="h-6 w-6 text-[#a34d48]" strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-lg font-bold leading-6 text-foreground">{step.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6f5952]">{step.description}</p>
                  <Button className="mt-3 h-8 rounded-full bg-[#ee776c] px-4 text-sm text-white shadow-md hover:bg-[#dd675e]" asChild>
                    <Link href={step.href}>{step.actionLabel}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!hasProgress && (
        <Card className="border border-[#dfb6aa] bg-[#fff8f1] shadow-sm">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vocab"
          value={stats.learnedVocabulary}
          description="Từ vựng đã học"
          subtitle="Học từ vựng đầu tiên!"
          icon={<Image src="/assets/vocab-card-clean.png" alt="" width={220} height={220} aria-hidden="true" className="h-32 w-32 bg-transparent object-contain" style={{ backgroundColor: "transparent" }} />}
          className="relative min-h-36 overflow-hidden border-none bg-transparent shadow-none"
          style={paperCardStyle}
          contentClassName="px-7 py-5 pr-40"
          descriptionClassName="text-sm font-medium text-foreground"
          iconClassName="absolute right-2 top-3 bg-transparent p-0"
          titleClassName="text-2xl font-extrabold leading-none tracking-tight text-foreground"
          valueClassName="text-4xl font-bold leading-none tracking-tight"
          subtitleClassName="mt-1 text-sm font-semibold text-[#8f4742]"
        />
        <StatsCard
          title="Grammar"
          value={completedGrammar}
          description="Ngữ pháp đã học"
          subtitle="Học từ ngữ pháp đầu tiên!"
          icon={<Image src="/assets/grammar-card-clean.png" alt="" width={220} height={220} aria-hidden="true" className="h-32 w-32 bg-transparent object-contain" style={{ backgroundColor: "transparent" }} />}
          className="relative min-h-36 overflow-hidden border-none bg-transparent shadow-none"
          style={paperCardStyle}
          contentClassName="px-7 py-5 pr-40"
          descriptionClassName="text-sm font-medium text-foreground"
          iconClassName="absolute right-2 top-3 bg-transparent p-0"
          titleClassName="text-2xl font-extrabold leading-none tracking-tight text-foreground"
          valueClassName="text-4xl font-bold leading-none tracking-tight"
          subtitleClassName="mt-1 text-sm font-semibold text-[#8f4742]"
        />
        <StatsCard
          title="Quiz"
          value={stats.quizAttempts}
          description="Quiz đã làm"
          subtitle="Học từ làm đầu tiên!"
          icon={<Image src="/assets/quiz-card-clean.png" alt="" width={220} height={220} aria-hidden="true" className="h-32 w-32 bg-transparent object-contain" style={{ backgroundColor: "transparent" }} />}
          className="relative min-h-36 overflow-hidden border-none bg-transparent shadow-none"
          style={paperCardStyle}
          contentClassName="px-7 py-5 pr-40"
          descriptionClassName="text-sm font-medium text-foreground"
          iconClassName="absolute right-2 top-3 bg-transparent p-0"
          titleClassName="text-2xl font-extrabold leading-none tracking-tight text-foreground"
          valueClassName="text-4xl font-bold leading-none tracking-tight"
          subtitleClassName="mt-1 text-sm font-semibold text-[#8f4742]"
        />
        <StatsCard
          title="Avg Score"
          value={`${stats.averageQuizScore}%`}
          description="Điểm trung bình"
          subtitle="tất cả quiz"
          icon={
            <div className="grid h-16 w-16 place-items-center rounded-full border-[10px] border-[#e6d6bd] bg-[#fff8f1] text-[#c96b6b]">
              <TrendingUp className="h-5 w-5" />
            </div>
          }
          className="relative min-h-32 overflow-hidden border-none bg-transparent shadow-none"
          style={paperCardStyle}
          contentClassName="px-7 py-5 pr-24"
          iconClassName="absolute right-3 top-3 bg-transparent p-0"
          descriptionClassName="text-sm font-medium text-foreground"
          titleClassName="text-2xl font-extrabold leading-none tracking-tight text-foreground"
          valueClassName="text-4xl font-bold leading-none tracking-tight"
          subtitleClassName="mt-1 text-sm font-semibold text-[#8f4742]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-visible border-none bg-transparent shadow-none">
            <div className="relative -mx-2 aspect-[1849/929] overflow-visible sm:-mx-4">
              <Image
                src="/assets/times.png"
                alt="Thời gian học 7 ngày qua"
                width={1849}
                height={929}
                className="h-full w-full object-contain"
              />
              <div className="sr-only">Thời gian học 7 ngày qua. Số phút học được ghi từ activity thật của tài khoản.</div>
            </div>
          </Card>

          <Card className="border border-[#dfb6aa] bg-card shadow-sm">
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

        <Card className="relative min-h-[520px] overflow-hidden border-none bg-transparent shadow-none">
          <Image
            src="/assets/quiz.png"
            alt=""
            width={900}
            height={1400}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-fill"
          />
          <div className="relative z-10 px-8 py-8">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#8f4742]" />
              <h2 className="text-xl font-bold">Hoạt động gần đây</h2>
            </div>
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
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
