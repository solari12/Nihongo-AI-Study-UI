"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Clock, Compass, Flag, GraduationCap, Map, Sparkles, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useActivityLog, type LearningActivity } from "@/hooks/use-activity-log"
import { useLearnerProfile, type InitialLevel, type LearningGoal } from "@/hooks/use-learner-profile"
import { useRecommendations } from "@/hooks/use-recommendations"
import { useStudyProgress } from "@/hooks/use-study-progress"
import { getCompletedGrammarPatternsFromActivities } from "@/lib/grammar/progress"
import { useI18n, type Locale } from "@/lib/i18n"
import { buildDailyPlan } from "@/lib/recommendation/daily-plan"
import type { Recommendation, RecommendationType } from "@/lib/recommendation/recommendation-engine"

const paperPanelStyle = {
  backgroundColor: "#fff8ef",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const scrollCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/image-removebg-preview.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const progressCardStyle = {
  backgroundColor: "transparent",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

const copy = {
  vi: {
    badge: "Bản đồ học tập",
    title: "Lộ trình học tiếng Nhật của bạn",
    description:
      "Một tuyến học dễ theo dõi: biết đang bắt đầu ở đâu, hôm nay làm gì và sau đó chuyển sang chặng nào.",
    editProfile: "Chỉnh hồ sơ",
    placement: "Kiểm tra đầu vào",
    todayTitle: "Việc nên làm tiếp theo",
    todayDescription: "Các bước này được viết lại theo ngôn ngữ học viên để bạn chỉ cần học theo.",
    stagesTitle: "Các chặng chính",
    stagesDescription: "Lộ trình có thể đổi thứ tự nhẹ sau khi bạn học thêm hoặc làm quiz.",
    progressTitle: "Tình hình hiện tại",
    progressDescription: "Chỉ hiển thị tín hiệu học tập cần thiết, không đưa điểm kỹ thuật vào giao diện.",
    emptyTitle: "Chưa có lộ trình cụ thể",
    emptyDescription: "Tạo hồ sơ học trước để Kami biết mục tiêu, thời gian và nền tảng kana của bạn.",
    createProfile: "Tạo lộ trình",
    start: "Bắt đầu",
    continue: "Tiếp tục",
    notStarted: "Chưa học",
    inProgress: "Đang học",
    completedToday: "Hoàn thành hôm nay",
    completedTodayTitle: "Đã hoàn thành hôm nay",
    completedTodayDescription: "Các phiên đã xong sẽ không được gợi ý lại làm task chính trong hôm nay.",
    allDoneTitle: "Hôm nay đã đủ nhịp học",
    allDoneDescription: "Bạn đã hoàn thành các phiên chính. Có thể quay lại ôn tập nhẹ hoặc học thêm nếu muốn.",
    studyMore: "Học thêm",
    minutes: "phút/ngày",
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    quiz: "Kiểm tra",
    review: "Ôn tập",
    current: "Đang học",
    next: "Tiếp theo",
    done: "Đã có dữ liệu",
    goalJLPT: "Thi JLPT N5",
    goalCommunication: "Giao tiếp cơ bản",
    goalFromZero: "Bắt đầu từ số 0",
    levelAbsolute: "Bắt đầu với kana và từ nền tảng",
    levelEarly: "Có thể vào nội dung N5 cơ bản",
    levelReview: "Ưu tiên ôn lỗ hổng và luyện quiz",
    noLevel: "Chưa kiểm tra, dùng hồ sơ học để bắt đầu",
    learnedWords: "Từ đã học",
    grammarItems: "Mẫu ngữ pháp",
    quizAttempts: "Lượt quiz",
    reviewWords: "Từ nên ôn",
    reasonProfile: "Bước này giúp lộ trình hiểu mục tiêu, thời gian học và nền tảng hiện tại.",
    reasonPlacement: "Bài kiểm tra ngắn giúp chọn điểm bắt đầu sát hơn.",
    reasonVocab: "Tăng vốn từ để đọc ví dụ và câu hỏi dễ hơn.",
    reasonGrammar: "Học mẫu câu để ghép từ thành câu có nghĩa.",
    reasonQuiz: "Dùng quiz ngắn để kiểm tra phần vừa học.",
    reasonReview: "Ôn lại nội dung đã gặp để giảm quên.",
    jlptStage1: "Ổn định kana và nhóm từ N5 thường gặp.",
    jlptStage2: "Học ngữ pháp N5 theo mẫu câu ngắn.",
    jlptStage3: "Thêm kanji N5, đọc hiểu cơ bản và quiz định kỳ.",
    jlptStage4: "Ôn lỗi sai trước khi luyện đề.",
    commStage1: "Ôn kana đủ dùng cho câu giao tiếp ngắn.",
    commStage2: "Học từ vựng theo tình huống gần nhu cầu.",
    commStage3: "Luyện mẫu câu hỏi đáp hằng ngày.",
    commStage4: "Làm quiz nhẹ để giữ nhịp và mở rộng chủ đề.",
    zeroStage1: "Bắt đầu với hiragana, katakana và phát âm.",
    zeroStage2: "Học nhóm từ đầu tiên bằng hình ảnh và ví dụ ngắn.",
    zeroStage3: "Ghép câu đơn giản với ngữ pháp N5 nền tảng.",
    zeroStage4: "Làm quiz nhỏ để xác nhận đã sẵn sàng đi tiếp.",
  },
  en: {
    badge: "Study map",
    title: "Your Japanese learning path",
    description:
      "A clear route: where you start, what to do today, and which stage comes next.",
    editProfile: "Edit profile",
    placement: "Starting check",
    todayTitle: "What to do next",
    todayDescription: "These steps are rewritten in learner language so you can simply follow them.",
    stagesTitle: "Main stages",
    stagesDescription: "The order can shift a little after more study or quiz results.",
    progressTitle: "Current picture",
    progressDescription: "Only useful learning signals are shown here.",
    emptyTitle: "No concrete path yet",
    emptyDescription: "Create a study profile first so Kami knows your goal, time, and kana base.",
    createProfile: "Create path",
    start: "Start",
    continue: "Continue",
    notStarted: "Not started",
    inProgress: "In progress",
    completedToday: "Completed today",
    completedTodayTitle: "Completed today",
    completedTodayDescription: "Finished sessions will not be suggested again as today's main task.",
    allDoneTitle: "Today's pace is complete",
    allDoneDescription: "You have completed the main sessions. You can review lightly or study more.",
    studyMore: "Study more",
    minutes: "min/day",
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    quiz: "Check",
    review: "Review",
    current: "Now",
    next: "Next",
    done: "Data ready",
    goalJLPT: "JLPT N5",
    goalCommunication: "Basic conversation",
    goalFromZero: "Start from zero",
    levelAbsolute: "Start with kana and foundation words",
    levelEarly: "Ready for basic N5 content",
    levelReview: "Review gaps and practice quizzes",
    noLevel: "No check yet, using your profile to start",
    learnedWords: "Learned words",
    grammarItems: "Grammar items",
    quizAttempts: "Quiz attempts",
    reviewWords: "Words to review",
    reasonProfile: "This helps the path know your goal, study time, and current foundation.",
    reasonPlacement: "A short check picks a closer starting point.",
    reasonVocab: "Build vocabulary so examples and questions are easier.",
    reasonGrammar: "Learn sentence patterns to turn words into meaning.",
    reasonQuiz: "Use a short quiz to check the latest lesson.",
    reasonReview: "Review familiar content so it sticks longer.",
    jlptStage1: "Stabilize kana and common N5 word groups.",
    jlptStage2: "Study N5 grammar through short sentence patterns.",
    jlptStage3: "Add N5 kanji, basic reading, and regular quizzes.",
    jlptStage4: "Review mistakes before practice tests.",
    commStage1: "Review enough kana for short conversation.",
    commStage2: "Study vocabulary by useful situations.",
    commStage3: "Practice daily question-answer patterns.",
    commStage4: "Use light quizzes to keep pace and expand topics.",
    zeroStage1: "Start with hiragana, katakana, and pronunciation.",
    zeroStage2: "Learn first word groups with images and short examples.",
    zeroStage3: "Build simple sentences with foundation N5 grammar.",
    zeroStage4: "Take small quizzes before moving forward.",
  },
  ja: {
    badge: "学習マップ",
    title: "あなたの日本語学習ルート",
    description: "開始位置、今日やること、次の段階が見える学習ルートです。",
    editProfile: "プロフィール編集",
    placement: "開始チェック",
    todayTitle: "次にやること",
    todayDescription: "学習者向けの言葉で表示するので、そのまま進められます。",
    stagesTitle: "主な段階",
    stagesDescription: "学習やクイズの結果に合わせて、順番は少し変わります。",
    progressTitle: "現在の状況",
    progressDescription: "学習に必要な情報だけを表示します。",
    emptyTitle: "まだ具体的なルートがありません",
    emptyDescription: "まずプロフィールを作ると、Kamiが目標、時間、かなの状態を把握できます。",
    createProfile: "ルートを作る",
    start: "始める",
    continue: "続ける",
    notStarted: "未学習",
    inProgress: "学習中",
    completedToday: "今日完了",
    completedTodayTitle: "今日完了した学習",
    completedTodayDescription: "完了したセッションは、今日の主タスクとして再表示されません。",
    allDoneTitle: "今日の学習ペースは完了",
    allDoneDescription: "主なセッションは完了しました。軽く復習するか、追加で学習できます。",
    studyMore: "追加で学ぶ",
    minutes: "分/日",
    vocabulary: "語彙",
    grammar: "文法",
    quiz: "確認",
    review: "復習",
    current: "今ここ",
    next: "次",
    done: "記録あり",
    goalJLPT: "JLPT N5",
    goalCommunication: "基本会話",
    goalFromZero: "ゼロから始める",
    levelAbsolute: "かなと基礎語彙から始める",
    levelEarly: "N5基礎に進める",
    levelReview: "弱点復習とクイズを優先",
    noLevel: "未確認のためプロフィールから開始",
    learnedWords: "学習済み語彙",
    grammarItems: "文法項目",
    quizAttempts: "クイズ回数",
    reviewWords: "復習語彙",
    reasonProfile: "目標、学習時間、今の基礎をルートに反映します。",
    reasonPlacement: "短い確認で開始位置を近づけます。",
    reasonVocab: "語彙を増やすと例文や問題が読みやすくなります。",
    reasonGrammar: "文型を学ぶと単語を意味のある文にできます。",
    reasonQuiz: "短いクイズで直近の内容を確認します。",
    reasonReview: "一度見た内容を復習して記憶に残します。",
    jlptStage1: "かなとN5頻出語彙を安定させる。",
    jlptStage2: "短い文型でN5文法を学ぶ。",
    jlptStage3: "N5漢字、基礎読解、定期クイズを加える。",
    jlptStage4: "練習問題の前に間違いを復習する。",
    commStage1: "短い会話に必要なかなを確認する。",
    commStage2: "使う場面ごとに語彙を学ぶ。",
    commStage3: "日常の質問と答え方を練習する。",
    commStage4: "軽いクイズでペースを保ち、話題を広げる。",
    zeroStage1: "ひらがな、カタカナ、発音から始める。",
    zeroStage2: "画像と短い例文で最初の語彙を学ぶ。",
    zeroStage3: "N5基礎文法で簡単な文を作る。",
    zeroStage4: "小さなクイズで次へ進めるか確認する。",
  },
} satisfies Record<Locale, Record<string, string>>

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}

function isSameDay(firstDate: string, secondDate = new Date()) {
  const first = new Date(firstDate)

  return (
    first.getFullYear() === secondDate.getFullYear() &&
    first.getMonth() === secondDate.getMonth() &&
    first.getDate() === secondDate.getDate()
  )
}

function isCompletedToday(activity: LearningActivity) {
  return (
    activity.result === "completed" &&
    isSameDay(activity.createdAt) &&
    ["vocabulary_session", "grammar_session", "quiz", "review"].includes(activity.type)
  )
}

function goalLabel(goal: LearningGoal, text: (typeof copy)[Locale]) {
  if (goal === "JLPT_N5") return text.goalJLPT
  if (goal === "COMMUNICATION") return text.goalCommunication
  return text.goalFromZero
}

function levelLabel(level: InitialLevel | undefined, text: (typeof copy)[Locale]) {
  if (level === "absolute_beginner") return text.levelAbsolute
  if (level === "early_n5") return text.levelEarly
  if (level === "n5_review") return text.levelReview
  return text.noLevel
}

function typeLabel(type: RecommendationType, text: (typeof copy)[Locale]) {
  if (type === "vocabulary") return text.vocabulary
  if (type === "grammar") return text.grammar
  if (type === "quiz") return text.quiz
  return text.review
}

function activityTypeLabel(activity: LearningActivity, text: (typeof copy)[Locale]) {
  if (activity.type === "vocabulary" || activity.type === "vocabulary_session") return text.vocabulary
  if (activity.type === "grammar" || activity.type === "grammar_session") return text.grammar
  if (activity.type === "quiz") return text.quiz
  return text.review
}

function reasonFor(item: Recommendation, text: (typeof copy)[Locale]) {
  if (item.id.includes("onboarding")) return text.reasonProfile
  if (item.id.includes("placement")) return text.reasonPlacement
  if (item.type === "vocabulary") return text.reasonVocab
  if (item.type === "grammar") return text.reasonGrammar
  if (item.type === "quiz") return text.reasonQuiz
  return text.reasonReview
}

function assetForType(type: RecommendationType) {
  if (type === "vocabulary") return "/assets/vocab-card-clean.png"
  if (type === "grammar") return "/assets/grammar-card-clean.png"
  if (type === "quiz") return "/assets/quiz-card-clean.png"
  return "/assets/paper-card-bg-clean.png"
}

function accentForType(type: RecommendationType) {
  if (type === "vocabulary") return "text-[#a9554f] bg-[#f8d8cc]"
  if (type === "grammar") return "text-[#7a4f21] bg-[#f5dfbf]"
  if (type === "quiz") return "text-[#9f4b58] bg-[#f6cbd3]"
  return "text-[#6f5a43] bg-[#ead7bd]"
}

function buildStages(goal: LearningGoal, text: (typeof copy)[Locale]) {
  if (goal === "JLPT_N5") return [text.jlptStage1, text.jlptStage2, text.jlptStage3, text.jlptStage4]
  if (goal === "COMMUNICATION") return [text.commStage1, text.commStage2, text.commStage3, text.commStage4]
  return [text.zeroStage1, text.zeroStage2, text.zeroStage3, text.zeroStage4]
}

export default function LearningPathPage() {
  const { locale } = useI18n()
  const text = copy[locale] ?? copy.vi
  const { content } = useAdminContent()
  const { profile, placement } = useLearnerProfile()
  const { progress, stats } = useStudyProgress()
  const { recommendations } = useRecommendations()
  const { activities } = useActivityLog()

  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const totalGrammar = content.grammar.length || stats.totalGrammar
  const hasProfile = profile.completedOnboarding
  const dailyPlan = buildDailyPlan({
    recommendations,
    activities,
    dailyMinutes: profile.dailyMinutes,
    maxItems: 5,
  })
  const steps = dailyPlan.items
  const completedTodayActivities = activities.filter(isCompletedToday).slice(0, 4)
  const completedGrammarPatterns = getCompletedGrammarPatternsFromActivities(activities, content.grammar)
  const completedGrammarCount = Math.max(stats.completedGrammar, completedGrammarPatterns.size)
  const stages = buildStages(profile.goal, text)
  const vocabularyProgress = percent(stats.learnedVocabulary, totalVocabulary)
  const grammarProgress = percent(completedGrammarCount, totalGrammar)
  const quizProgress = Math.min(100, stats.quizAttempts * 20)
  const reviewProgress = Math.min(100, stats.reviewVocabulary * 20)

  return (
    <div className="space-y-8 bg-[#fff8f1] pb-4" data-i18n-managed>
      <section
        className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-[#e8b7aa]/70 p-6 shadow-[0_18px_45px_rgba(160,91,82,0.12)] md:p-8"
        style={paperPanelStyle}
      >
        <Image
          src="/assets/hero-torii.png"
          alt=""
          width={520}
          height={360}
          className="pointer-events-none absolute bottom-0 left-4 hidden max-h-[310px] w-auto object-contain opacity-95 lg:block"
          priority
        />
        <Image
          src="/assets/Flower.png"
          alt=""
          width={150}
          height={150}
          className="pointer-events-none absolute right-6 top-5 hidden opacity-70 md:block"
        />
        <div className="relative ml-auto max-w-2xl space-y-5 rounded-[1.75rem] bg-white/55 p-5 backdrop-blur-sm lg:mr-4 lg:mt-10">
          <Badge className="rounded-full bg-[#f8d8cc] text-[#8d413c] shadow-sm">
            <Map className="mr-1.5 h-3.5 w-3.5" />
            {text.badge}
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#2b211c] md:text-4xl">{text.title}</h1>
            <p className="text-base leading-7 text-[#6b5750] md:text-lg">{text.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-[#9f3f33] px-6 text-white shadow-md hover:bg-[#84352d]">
              <Link href="/onboarding">{hasProfile ? text.editProfile : text.createProfile}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-[#c98f80] bg-white/80 px-6 text-[#6f372f] hover:bg-[#fff2ee]"
            >
              <Link href="/placement-test">{text.placement}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: text.current,
            value: hasProfile ? goalLabel(profile.goal, text) : text.emptyTitle,
            detail: placement.completed ? levelLabel(placement.level, text) : text.noLevel,
            image: "/assets/vocab-card-clean.png",
          },
          {
            label: text.next,
            value: steps[0] ? typeLabel(steps[0].type, text) : text.createProfile,
            detail: steps[0]?.estimatedTime ?? `${profile.dailyMinutes || 30} ${text.minutes}`,
            image: "/assets/grammar-card-clean.png",
          },
          {
            label: text.done,
            value: progress.learnedVocabularyIds.length + stats.quizAttempts,
            detail: `${profile.dailyMinutes || 30} ${text.minutes}`,
            image: "/assets/quiz-card-clean.png",
          },
        ].map((item) => (
          <Card
            key={item.label}
            className="relative min-h-[132px] overflow-hidden border border-[#ead4c7] bg-[#fffaf4] shadow-[0_10px_28px_rgba(88,55,38,0.08)]"
          >
            <Image
              src={item.image}
              alt=""
              width={150}
              height={110}
              className="absolute -right-2 -top-2 h-28 w-36 object-contain opacity-45"
            />
            <CardHeader className="relative pb-2">
              <CardDescription className="text-[#9a7164]">{item.label}</CardDescription>
              <CardTitle className="max-w-[70%] text-2xl text-[#261c18]">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="relative text-sm text-[#7c6257]">{item.detail}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card
          className="overflow-hidden border border-[#e8c8b9] bg-[#fffaf4] shadow-[0_16px_38px_rgba(92,58,40,0.1)]"
          style={paperPanelStyle}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2b211c]">
              <Compass className="h-5 w-5 text-[#a84c42]" />
              {text.todayTitle}
            </CardTitle>
            <CardDescription className="text-[#7c6257]">{text.todayDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {completedTodayActivities.length > 0 ? (
              <div className="rounded-3xl border border-[#d9e6d2] bg-[#f4fbf1]/80 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-[#315d41]">{text.completedTodayTitle}</h3>
                    <p className="text-sm text-[#5f745f]">{text.completedTodayDescription}</p>
                  </div>
                  <Badge className="w-fit rounded-full bg-[#dcebd9] text-[#315d41]">
                    {completedTodayActivities.length} {text.completedToday}
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {completedTodayActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 rounded-2xl bg-white/75 px-4 py-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#315d41]" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#2b211c]">{activity.topic ?? activityTypeLabel(activity, text)}</p>
                        <p className="truncate text-[#6f7d66]">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {steps.length ? (
              steps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative min-h-[205px] overflow-hidden p-6"
                  style={scrollCardStyle}
                >
                  <Image
                    src={assetForType(step.type)}
                    alt=""
                    width={110}
                    height={88}
                    className="pointer-events-none absolute left-5 top-7 h-16 w-20 object-contain opacity-80"
                  />
                  <div className="relative flex h-full flex-col justify-between gap-4 pt-14">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-[#9f3f33] shadow-sm">
                          {index + 1}
                        </span>
                        <Badge className={`rounded-full ${accentForType(step.type)}`}>
                          {typeLabel(step.type, text)}
                        </Badge>
                        <Badge className={index === 0 ? "rounded-full bg-[#fff3cf] text-[#83572a]" : "rounded-full bg-white/80 text-[#7c6257]"}>
                          {index === 0 ? text.inProgress : text.notStarted}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-[#7c6257]">
                          <Clock className="h-3.5 w-3.5" />
                          {step.estimatedTime}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-lg font-bold text-[#2b211c]">{step.title}</h3>
                      <p className="line-clamp-3 text-sm leading-6 text-[#755f55]">{reasonFor(step, text)}</p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className={
                        index === 0
                          ? "rounded-full bg-[#f46f61] text-white shadow-md hover:bg-[#d95b51]"
                          : "rounded-full border-[#c89984] bg-white/80 text-[#6f372f] hover:bg-[#fff2ee]"
                      }
                      variant={index === 0 ? "default" : "outline"}
                    >
                      <Link href={step.targetUrl}>
                        {index === 0 ? text.continue : text.start}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-[#d9a492] bg-white/60 p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">{dailyPlan.isGoalComplete ? text.allDoneTitle : text.emptyTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dailyPlan.isGoalComplete ? text.allDoneDescription : text.emptyDescription}
                </p>
                <Button asChild className="mt-4 rounded-full bg-[#9f3f33]">
                  <Link href={dailyPlan.isGoalComplete ? "/vocabulary" : "/onboarding"}>
                    {dailyPlan.isGoalComplete ? text.studyMore : text.createProfile}
                  </Link>
                </Button>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card
            className="relative overflow-hidden border border-[#e8c8b9] bg-[#fffaf4] shadow-[0_16px_38px_rgba(92,58,40,0.1)]"
            style={paperPanelStyle}
          >
            <Image
              src="/assets/times.png"
              alt=""
              width={130}
              height={130}
              className="absolute -right-2 -top-6 opacity-45"
            />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2b211c]">
                <Flag className="h-5 w-5 text-[#a84c42]" />
                {text.stagesTitle}
              </CardTitle>
              <CardDescription className="text-[#7c6257]">{text.stagesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage} className="flex gap-3 rounded-2xl bg-white/55 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8d8cc] text-sm font-semibold text-[#9f3f33]">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-[#5c4942]">{stage}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-[#e8c8b9] bg-[#fffaf4] shadow-[0_16px_38px_rgba(92,58,40,0.1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2b211c]">
                <Target className="h-5 w-5 text-[#a84c42]" />
                {text.progressTitle}
              </CardTitle>
              <CardDescription className="text-[#7c6257]">{text.progressDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: text.learnedWords,
                  value: `${stats.learnedVocabulary}/${totalVocabulary}`,
                  progress: vocabularyProgress,
                  icon: BookOpen,
                  image: "/assets/vocab-card-clean.png",
                },
                {
                  label: text.grammarItems,
                  value: `${completedGrammarCount}/${totalGrammar}`,
                  progress: grammarProgress,
                  icon: GraduationCap,
                  image: "/assets/grammar-card-clean.png",
                },
                {
                  label: text.quizAttempts,
                  value: `${stats.quizAttempts}`,
                  progress: quizProgress,
                  icon: CheckCircle2,
                  image: "/assets/quiz-card-clean.png",
                },
                {
                  label: text.reviewWords,
                  value: `${stats.reviewVocabulary}`,
                  progress: reviewProgress,
                  icon: Target,
                  image: "/assets/paper-card-bg-clean.png",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="relative min-h-[120px] overflow-hidden rounded-2xl border border-[#ead4c7] bg-white/70 p-4"
                  style={progressCardStyle}
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={95}
                    height={75}
                    className="absolute -right-3 -top-2 h-20 w-24 object-contain opacity-40"
                  />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#7c6257]">
                      <item.icon className="h-4 w-4 text-[#a84c42]" />
                      {item.label}
                    </div>
                    <div className="text-2xl font-bold text-[#2b211c]">{item.value}</div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
