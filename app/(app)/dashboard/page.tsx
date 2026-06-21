"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Flag,
  GraduationCap,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useLearnerProfile, type LearningGoal } from "@/hooks/use-learner-profile"
import { useRecommendations } from "@/hooks/use-recommendations"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { getCompletedGrammarPatternsFromActivities } from "@/lib/grammar/progress"
import { useI18n, type Locale } from "@/lib/i18n"
import type { Recommendation, RecommendationType } from "@/lib/recommendation/recommendation-engine"

const copy = {
  vi: {
    heroBadge: "Lộ trình cá nhân",
    heroTitle: "Hôm nay nên học gì?",
    heroDescription:
      "Kami chọn vài việc học rõ ràng dựa trên mục tiêu, thời gian rảnh và tiến độ gần đây của bạn.",
    continuePlan: "Tiếp tục lộ trình",
    editProfile: "Chỉnh hồ sơ",
    setupTitle: "Thiết lập điểm bắt đầu",
    setupBody: "Hoàn tất hồ sơ hoặc bài kiểm tra ngắn để lộ trình khớp hơn với trình độ hiện tại.",
    setupCta: "Thiết lập ngay",
    currentGoal: "Mục tiêu hiện tại",
    dailyPace: "Nhịp học",
    progressN5: "Tiến độ N5",
    recentDays: "Ngày học gần đây",
    todayPlan: "Kế hoạch hôm nay",
    todayPlanDescription: "Làm theo thứ tự này để học vừa sức trong một buổi.",
    noPlanTitle: "Chưa có dữ liệu để tạo kế hoạch",
    noPlanBody: "Hãy tạo hồ sơ học trước, sau đó Kami sẽ gợi ý bài phù hợp hơn.",
    start: "Bắt đầu",
    minutes: "phút",
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    quiz: "Kiểm tra",
    review: "Ôn tập",
    insightTitle: "Tín hiệu học tập",
    insightDescription: "Các gợi ý dễ hiểu để bạn biết nên giữ nhịp hay ôn lại phần nào.",
    insightEmpty: "Sau vài bài học hoặc quiz, khu vực này sẽ có nhận xét cụ thể hơn.",
    learnedWords: "Từ đã học",
    reviewWords: "Từ nên ôn",
    quizAverage: "Điểm quiz TB",
    quickLinks: "Đi nhanh",
    vocabularyLink: "Học từ vựng",
    grammarLink: "Học ngữ pháp",
    quizLink: "Làm quiz",
    pathLink: "Xem lộ trình",
    goalJLPT: "Thi JLPT N5",
    goalCommunication: "Giao tiếp cơ bản",
    goalFromZero: "Bắt đầu từ số 0",
    noGoal: "Chưa chọn mục tiêu",
    kanaReady: "Kana khá ổn",
    kanaHiragana: "Đã biết hiragana",
    kanaNone: "Cần bắt đầu với kana",
    placementReady: "Đã có kiểm tra đầu vào",
    placementNeeded: "Có thể kiểm tra đầu vào để tinh chỉnh",
    reasonProfile: "Hoàn tất hồ sơ để Kami biết bạn muốn học theo hướng nào.",
    reasonPlacement: "Làm bài kiểm tra ngắn để xác định điểm bắt đầu.",
    reasonVocab: "Tăng vốn từ trước khi sang câu mẫu dài hơn.",
    reasonGrammar: "Củng cố mẫu câu để đọc và trả lời quiz chắc hơn.",
    reasonQuiz: "Kiểm tra nhanh để biết phần nào cần ôn lại.",
    reasonReview: "Ôn lại nội dung đã gặp để nhớ lâu hơn.",
  },
  en: {
    heroBadge: "Personal path",
    heroTitle: "What should you study today?",
    heroDescription:
      "Kami picks a few clear study actions from your goal, available time, and recent progress.",
    continuePlan: "Continue path",
    editProfile: "Edit profile",
    setupTitle: "Set your starting point",
    setupBody: "Complete your profile or a short check so the path fits your current level.",
    setupCta: "Set up now",
    currentGoal: "Current goal",
    dailyPace: "Daily pace",
    progressN5: "N5 progress",
    recentDays: "Recent study days",
    todayPlan: "Today plan",
    todayPlanDescription: "Follow this order for a manageable study session.",
    noPlanTitle: "Not enough data for a plan yet",
    noPlanBody: "Create your study profile first, then Kami can suggest better lessons.",
    start: "Start",
    minutes: "minutes",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    quiz: "Check",
    review: "Review",
    insightTitle: "Study signals",
    insightDescription: "Learner-friendly cues for keeping pace or reviewing the right part.",
    insightEmpty: "After a few lessons or quizzes, this area will show more specific notes.",
    learnedWords: "Learned words",
    reviewWords: "Words to review",
    quizAverage: "Avg. quiz result",
    quickLinks: "Quick links",
    vocabularyLink: "Study vocabulary",
    grammarLink: "Study grammar",
    quizLink: "Take quiz",
    pathLink: "View path",
    goalJLPT: "JLPT N5",
    goalCommunication: "Basic conversation",
    goalFromZero: "Start from zero",
    noGoal: "No goal yet",
    kanaReady: "Kana is usable",
    kanaHiragana: "Hiragana known",
    kanaNone: "Start with kana",
    placementReady: "Starting check completed",
    placementNeeded: "Optional check can refine the path",
    reasonProfile: "Complete your profile so Kami knows your learning direction.",
    reasonPlacement: "Take a short check to find the right starting point.",
    reasonVocab: "Build vocabulary before longer sentence patterns.",
    reasonGrammar: "Strengthen sentence patterns for reading and quiz answers.",
    reasonQuiz: "Use a quick check to see what needs review.",
    reasonReview: "Review familiar content so it sticks longer.",
  },
  ja: {
    heroBadge: "個別ルート",
    heroTitle: "今日は何を学ぶ？",
    heroDescription: "Kamiが目標、学習時間、最近の進み具合から今日の学習を選びます。",
    continuePlan: "ルートを続ける",
    editProfile: "プロフィール編集",
    setupTitle: "開始位置を設定",
    setupBody: "プロフィールや短い確認テストで、今のレベルに合うルートにします。",
    setupCta: "設定する",
    currentGoal: "現在の目標",
    dailyPace: "学習ペース",
    progressN5: "N5の進み具合",
    recentDays: "最近学んだ日",
    todayPlan: "今日の学習",
    todayPlanDescription: "この順番なら、一回の学習で進めやすくなります。",
    noPlanTitle: "まだ学習プランを作れません",
    noPlanBody: "まず学習プロフィールを作ると、Kamiが合う教材を選びます。",
    start: "始める",
    minutes: "分",
    vocabulary: "語彙",
    grammar: "文法",
    quiz: "確認",
    review: "復習",
    insightTitle: "学習のヒント",
    insightDescription: "ペース維持や復習すべき部分をわかりやすく表示します。",
    insightEmpty: "いくつか学習やクイズを行うと、ここに具体的なヒントが出ます。",
    learnedWords: "学習済み語彙",
    reviewWords: "復習する語彙",
    quizAverage: "クイズ平均",
    quickLinks: "すぐ始める",
    vocabularyLink: "語彙を学ぶ",
    grammarLink: "文法を学ぶ",
    quizLink: "クイズをする",
    pathLink: "ルートを見る",
    goalJLPT: "JLPT N5",
    goalCommunication: "基本会話",
    goalFromZero: "ゼロから始める",
    noGoal: "目標未設定",
    kanaReady: "かなは読める",
    kanaHiragana: "ひらがなは分かる",
    kanaNone: "かなから始める",
    placementReady: "開始チェック済み",
    placementNeeded: "確認テストで調整できます",
    reasonProfile: "プロフィールを作ると、Kamiが学習方向を把握できます。",
    reasonPlacement: "短い確認テストで開始位置を決めます。",
    reasonVocab: "長い文に入る前に語彙を増やします。",
    reasonGrammar: "文型を固めると読解とクイズが安定します。",
    reasonQuiz: "短い確認で復習すべき部分を見つけます。",
    reasonReview: "一度見た内容を復習して記憶に残します。",
  },
} satisfies Record<Locale, Record<string, string>>

function getGoalLabel(goal: LearningGoal, text: (typeof copy)[Locale]) {
  if (goal === "JLPT_N5") return text.goalJLPT
  if (goal === "COMMUNICATION") return text.goalCommunication
  return text.goalFromZero
}

function getKanaLabel(kanaLevel: string, text: (typeof copy)[Locale]) {
  if (kanaLevel === "hiragana_katakana") return text.kanaReady
  if (kanaLevel === "hiragana") return text.kanaHiragana
  return text.kanaNone
}

function getTypeLabel(type: RecommendationType, text: (typeof copy)[Locale]) {
  if (type === "vocabulary") return text.vocabulary
  if (type === "grammar") return text.grammar
  if (type === "quiz") return text.quiz
  return text.review
}

function getLearnerReason(recommendation: Recommendation, text: (typeof copy)[Locale]) {
  if (recommendation.id.includes("onboarding")) return text.reasonProfile
  if (recommendation.id.includes("placement")) return text.reasonPlacement
  if (recommendation.type === "vocabulary") return text.reasonVocab
  if (recommendation.type === "grammar") return text.reasonGrammar
  if (recommendation.type === "quiz") return text.reasonQuiz
  return text.reasonReview
}

function getAssetForType(type: RecommendationType) {
  if (type === "vocabulary") return "/assets/vocab-card-clean.png"
  if (type === "grammar") return "/assets/grammar-card-clean.png"
  if (type === "quiz") return "/assets/quiz-card-clean.png"
  return "/assets/paper-card-bg-clean.png"
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export default function DashboardPage() {
  const { locale } = useI18n()
  const text = copy[locale] ?? copy.vi
  const { content } = useAdminContent()
  const { stats } = useStudyProgress()
  const { profile, placement } = useLearnerProfile()
  const { recommendations, activities } = useRecommendations()

  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const completedGrammarCount = Math.max(
    stats.completedGrammar,
    getCompletedGrammarPatternsFromActivities(activities, content.grammar).size
  )
  const n5Progress = clampPercent(
    ((stats.learnedVocabulary / Math.max(totalVocabulary, 1)) * 0.45 +
      (completedGrammarCount / Math.max(totalGrammar, 1)) * 0.35 +
      (stats.latestQuizScore / 100) * 0.2) *
      100
  )
  const recentStudyDays = new Set(activities.slice(0, 12).map((activity) => activity.createdAt.slice(0, 10))).size
  const hasProfile = profile.completedOnboarding
  const todayItems = recommendations.slice(0, 4)
  const hasSignals = stats.learnedVocabulary > 0 || stats.reviewVocabulary > 0 || stats.quizAttempts > 0
  const setupHref = hasProfile ? "/placement-test" : "/onboarding"

  return (
    <div className="space-y-8" data-i18n-managed>
      <section className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-6 shadow-sm md:p-8">
        <Image
          src="/assets/hero-torii.png"
          alt=""
          width={360}
          height={260}
          className="pointer-events-none absolute bottom-0 right-0 hidden opacity-90 md:block"
          priority
        />
        <div className="relative max-w-2xl space-y-5">
          <Badge className="rounded-full bg-white/80 text-primary shadow-sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {text.heroBadge}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{text.heroTitle}</h1>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">{text.heroDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/learning-path">
                {text.continuePlan}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl bg-white/70">
              <Link href="/onboarding">{text.editProfile}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{text.currentGoal}</CardDescription>
            <CardTitle className="text-xl">{hasProfile ? getGoalLabel(profile.goal, text) : text.noGoal}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="rounded-full">{getKanaLabel(profile.kanaLevel, text)}</Badge>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{text.dailyPace}</CardDescription>
            <CardTitle className="text-xl">{profile.dailyMinutes || 30} {text.minutes}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {placement.completed ? text.placementReady : text.placementNeeded}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{text.progressN5}</CardDescription>
            <CardTitle className="text-xl">{n5Progress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={n5Progress} className="h-2" />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>{text.recentDays}</CardDescription>
            <CardTitle className="text-xl">{recentStudyDays}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {activities[0]?.content ?? text.insightEmpty}
          </CardContent>
        </Card>
      </div>

      {!hasProfile || !placement.completed ? (
        <Card className="overflow-hidden border-amber-200 bg-amber-50/70">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">{text.setupTitle}</h2>
                <p className="text-sm text-muted-foreground">{text.setupBody}</p>
              </div>
            </div>
            <Button asChild className="rounded-2xl">
              <Link href={setupHref}>{text.setupCta}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {text.todayPlan}
            </CardTitle>
            <CardDescription>{text.todayPlanDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayItems.length ? (
              todayItems.map((item, index) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-3xl border bg-muted/20 p-4"
                >
                  <Image
                    src={getAssetForType(item.type)}
                    alt=""
                    width={180}
                    height={120}
                    className="pointer-events-none absolute right-0 top-0 hidden h-full w-44 object-cover opacity-25 sm:block"
                  />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-full">
                            {getTypeLabel(item.type, text)}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {item.estimatedTime}
                          </span>
                        </div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          {getLearnerReason(item, text)}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="rounded-2xl bg-white/80">
                      <Link href={item.targetUrl}>
                        {text.start}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed p-8 text-center">
                <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">{text.noPlanTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text.noPlanBody}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="relative overflow-hidden border-0 bg-white shadow-sm">
            <Image
              src="/assets/Flower.png"
              alt=""
              width={120}
              height={120}
              className="absolute -right-5 -top-5 opacity-30"
            />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                {text.insightTitle}
              </CardTitle>
              <CardDescription>{text.insightDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasSignals ? (
                <>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                    <span className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4" />{text.learnedWords}</span>
                    <strong>{stats.learnedVocabulary}/{totalVocabulary}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                    <span className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" />{text.reviewWords}</span>
                    <strong>{stats.reviewVocabulary}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                    <span className="flex items-center gap-2 text-sm"><Flag className="h-4 w-4" />{text.quizAverage}</span>
                    <strong>{stats.quizAttempts ? `${stats.averageQuizScore}%` : "-"}</strong>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">{text.insightEmpty}</p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{text.quickLinks}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { href: "/vocabulary", label: text.vocabularyLink, icon: BookOpen },
                { href: "/grammar", label: text.grammarLink, icon: GraduationCap },
                { href: "/quiz", label: text.quizLink, icon: CheckCircle2 },
                { href: "/learning-path", label: text.pathLink, icon: Compass },
              ].map((item) => (
                <Button key={item.href} asChild variant="ghost" className="justify-between rounded-2xl">
                  <Link href={item.href}>
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
