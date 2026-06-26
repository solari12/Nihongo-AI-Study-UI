"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LanguageSwitcher } from "@/components/app/language-switcher"
import { useI18n } from "@/lib/i18n"

type LandingArticle = {
  id: string
  title: string
  level: string
  category?: string | null
  articleText: string
  imageUrl?: string | null
  publishedAt?: string | null
}

const landingCopy = {
  vi: {
    nav: {
      features: "Chức năng",
      reading: "Bài đọc",
      plan: "Gợi ý học",
      admin: "Quản lý",
      kami: "Kami",
      login: "Đăng nhập",
      register: "Đăng ký",
    },
    hero: {
      badge: "Học tiếng Nhật N5 cùng Kami",
      title: "N5 không còn khó khi có Kami đồng hành.",
      description:
        "Mỗi ngày một chút từ vựng, một chút ngữ pháp, một bài đọc TODAII, một bài quiz nhỏ — Kami sẽ nhắc bạn đúng lúc, giải đáp ngay khi bạn bí và ghi lại tiến độ để dẫn bạn đi tiếp. Học tiếng Nhật dễ theo dõi hơn, có định hướng hơn và nhiều động lực hơn mỗi ngày.",
      primary: "Vào học ngay",
      secondary: "Xem chức năng",
    },
    preview: {
      title: "Góc học hôm nay",
      level: "N5 mới bắt đầu",
      cards: [
        { label: "Từ vựng", value: "語彙", tone: "border-red-200 bg-red-50 text-red-700" },
        { label: "Ngữ pháp", value: "文法", tone: "border-blue-200 bg-blue-50 text-blue-700" },
        { label: "Quiz", value: "試験", tone: "border-amber-200 bg-amber-50 text-amber-700" },
        { label: "Kami gợi ý", value: "AI", tone: "border-green-200 bg-green-50 text-green-700" },
      ],
      progressTitle: "Tiến độ hôm nay",
      progressMeta: "+12 từ mới",
      progressLeft: "68% mục tiêu N5",
      progressRight: "Quiz gần nhất: 84%",
    },
    features: {
      kicker: "Chức năng chính",
      title: "Một chỗ để học, ôn và hỏi khi mắc kẹt",
      description:
        "Các phần học được nối với nhau thành một luồng đơn giản: chọn bài, học, làm quiz, xem tiến độ và hỏi Kami.",
      items: [
        {
          icon: BookOpen,
          title: "Từ vựng N5",
          description: "Học từ với kana, romaji, nghĩa tiếng Việt, ví dụ và trạng thái ôn tập.",
        },
        {
          icon: FileText,
          title: "Ngữ pháp N5",
          description: "Xem cấu trúc, cách dùng và ví dụ Nhật - Việt theo cách dễ nhớ.",
        },
        {
          icon: ClipboardList,
          title: "Quiz luyện nhanh",
          description: "Làm câu hỏi theo từ vựng, ngữ pháp hoặc bài đọc để kiểm tra lại.",
        },
        {
          icon: History,
          title: "Lịch sử học",
          description: "Theo dõi những gì đã học, điểm quiz và hoạt động gần đây.",
        },
        {
          icon: LineChart,
          title: "Gợi ý bài tiếp theo",
          description: "App nhìn vào tiến độ và điểm quiz để gợi ý phần nên ôn trước.",
        },
        {
          icon: Bot,
          title: "Kami RAG",
          description: "Kami tìm trong dữ liệu app và bài đọc đã crawl trước khi trả lời.",
        },
      ],
    },
    reading: {
      kicker: "Bài đọc TODAII",
      title: "Đọc thử những bài đã được đưa vào app",
      description:
        "Các bài đọc có cấp độ JLPT, câu hỏi và nội dung để hỏi Kami. Bấm vào một bài để mở trang Reading.",
      action: "Đọc bài này",
      fallbackCategory: "Bài đọc",
    },
    plan: {
      badge: "Ôn đúng phần cần ôn",
      title: "App chọn vài việc học vừa sức cho hôm nay",
      description:
        "Dựa trên từ đã học, bài cần ôn, điểm quiz và lịch sử gần đây, app đưa ra danh sách ưu tiên để bạn khỏi phải tự đoán nên học gì.",
      tags: ["Theo tiến độ", "Ôn lặp lại", "Điểm ưu tiên", "Có lý do"],
      items: [
        { title: "Ôn từ vựng dễ quên", meta: "Ôn tập · Tiến độ cá nhân", value: 72, color: "bg-red-500" },
        { title: "Làm quiz phần còn yếu", meta: "Quiz · Chủ đề cần củng cố", value: 58, color: "bg-amber-500" },
        { title: "Học mẫu câu tiếp theo", meta: "Lộ trình · N5", value: 84, color: "bg-blue-500" },
      ],
    },
    admin: {
      title: "Quản lý nội dung",
      add: "Thêm",
      type: "Loại",
      content: "Nội dung",
      status: "Trạng thái",
      action: "Hành động",
      rows: [
        { type: "Từ vựng", item: "電話 / でんわ", action: "Sửa", status: "Đang dùng" },
        { type: "Ngữ pháp", item: "N は N です", action: "Sửa", status: "Đang dùng" },
        { type: "Quiz", item: "学生 nghĩa là gì?", action: "Xem", status: "Đang dùng" },
      ],
      badge: "Khu vực quản trị",
      heading: "Tự thêm bài học và bài đọc cho hệ thống",
      description:
        "Admin có thể thêm từ vựng, ngữ pháp, quiz hoặc import bài TODAII. Dữ liệu mới được dùng ngay cho Reading, Kami và phần gợi ý học.",
      bullets: ["Thêm/sửa/xóa nội dung học", "Import/export JSON để sao lưu", "Dữ liệu dùng chung cho toàn app"],
    },
    kami: {
      badge: "Kami dùng dữ liệu trong app",
      title: "Hỏi Kami khi bạn cần giải thích nhanh",
      description:
        "Kami có thể tìm trong từ vựng, ngữ pháp, quiz và bài đọc đã crawl. Nếu có nguồn phù hợp, câu trả lời sẽ bám theo dữ liệu đó.",
      retrieval: "Tìm nguồn",
      retrievalDesc: "Tìm nội dung liên quan trong dữ liệu học và bài đọc.",
      generation: "Trả lời",
      generationDesc: "Giải thích lại bằng tiếng Việt dễ hiểu.",
      question: "学生 nghĩa là gì?",
      answer: "学生 (がくせい / gakusei) nghĩa là học sinh hoặc sinh viên.",
      example: "Ví dụ: 私は学生です。= Tôi là sinh viên.",
      sourceA: "Nguồn từ vựng",
      sourceB: "Nguồn ngữ pháp",
    },
    cta: {
      title: "Sẵn sàng học thử chưa?",
      description: "Vào app để học bài đầu tiên, làm quiz và hỏi Kami khi gặp câu khó.",
      primary: "Bắt đầu học",
      secondary: "Tạo tài khoản",
    },
  },
  ja: {
    nav: {
      features: "機能",
      reading: "読解",
      plan: "学習提案",
      admin: "管理",
      kami: "Kami",
      login: "ログイン",
      register: "登録",
    },
    hero: {
      badge: "KamiとN5を学ぶ",
      title: "Kamiと一緒なら、N5はもう難しくありません。",
      description:
        "毎日少しの語彙、少しの文法、TODAIIの記事を一つ、小さなクイズを一つ。Kamiがちょうどよいタイミングで声をかけ、分からない時はすぐに説明し、進み具合を記録して次の一歩へ案内します。日本語学習をもっと見通しやすく、続けやすく、毎日少し楽しくします。",
      primary: "学習を始める",
      secondary: "機能を見る",
    },
    preview: {
      title: "今日の学習",
      level: "N5 初級",
      cards: [
        { label: "語彙", value: "語彙", tone: "border-red-200 bg-red-50 text-red-700" },
        { label: "文法", value: "文法", tone: "border-blue-200 bg-blue-50 text-blue-700" },
        { label: "クイズ", value: "試験", tone: "border-amber-200 bg-amber-50 text-amber-700" },
        { label: "Kami提案", value: "AI", tone: "border-green-200 bg-green-50 text-green-700" },
      ],
      progressTitle: "今日の進み具合",
      progressMeta: "+12 新しい語彙",
      progressLeft: "N5目標の68%",
      progressRight: "最新クイズ: 84%",
    },
    features: {
      kicker: "主な機能",
      title: "学ぶ、復習する、質問するを一つに",
      description:
        "教材選びからクイズ、進捗確認、Kamiへの質問まで、学習の流れをシンプルにまとめています。",
      items: [
        {
          icon: BookOpen,
          title: "N5語彙",
          description: "かな、ローマ字、意味、例文、復習状態をまとめて確認できます。",
        },
        {
          icon: FileText,
          title: "N5文法",
          description: "構造、使い方、日越の例文で文法をやさしく学べます。",
        },
        {
          icon: ClipboardList,
          title: "クイズ",
          description: "語彙、文法、読解の理解を短い問題で確認できます。",
        },
        {
          icon: History,
          title: "学習履歴",
          description: "学んだ内容、クイズ結果、最近の活動を記録します。",
        },
        {
          icon: LineChart,
          title: "次の学習提案",
          description: "進捗やクイズ結果から、今やるとよい学習を提案します。",
        },
        {
          icon: Bot,
          title: "Kami RAG",
          description: "アプリ内データや取り込んだ読解記事を探してから答えます。",
        },
      ],
    },
    reading: {
      kicker: "TODAII読解",
      title: "取り込んだ記事をすぐ読めます",
      description:
        "JLPTレベル、読解問題、Kamiに質問できる本文があります。記事を選ぶとReadingページで開きます。",
      action: "この記事を読む",
      fallbackCategory: "読解",
    },
    plan: {
      badge: "必要なところを復習",
      title: "今日やることを少しだけ選びます",
      description:
        "学習済みの語彙、復習予定、クイズ結果、最近の活動から、優先して取り組む内容を提案します。",
      tags: ["進捗ベース", "間隔復習", "優先度", "理由つき"],
      items: [
        { title: "忘れやすい語彙を復習", meta: "復習 · 個人進捗", value: 72, color: "bg-red-500" },
        { title: "弱い部分のクイズ", meta: "クイズ · 補強テーマ", value: 58, color: "bg-amber-500" },
        { title: "次の文型を学ぶ", meta: "学習ルート · N5", value: 84, color: "bg-blue-500" },
      ],
    },
    admin: {
      title: "コンテンツ管理",
      add: "追加",
      type: "種類",
      content: "内容",
      status: "状態",
      action: "操作",
      rows: [
        { type: "語彙", item: "電話 / でんわ", action: "編集", status: "使用中" },
        { type: "文法", item: "N は N です", action: "編集", status: "使用中" },
        { type: "クイズ", item: "学生の意味は？", action: "表示", status: "使用中" },
      ],
      badge: "管理画面",
      heading: "教材や読解記事を追加できます",
      description:
        "管理者は語彙、文法、クイズ、TODAII記事を追加できます。追加した内容はReading、Kami、学習提案ですぐ使えます。",
      bullets: ["教材の追加・編集・削除", "JSONでインポート/エクスポート", "アプリ全体で同じデータを利用"],
    },
    kami: {
      badge: "Kamiはアプリ内データを使います",
      title: "分からない時はKamiに質問",
      description:
        "Kamiは語彙、文法、クイズ、取り込んだ読解記事を探します。合う情報があれば、その内容に沿って説明します。",
      retrieval: "検索",
      retrievalDesc: "学習データや読解記事から関連情報を探します。",
      generation: "説明",
      generationDesc: "分かりやすい言葉で説明します。",
      question: "学生の意味は？",
      answer: "学生（がくせい / gakusei）は、学生・生徒という意味です。",
      example: "例: 私は学生です。= 私は学生です。",
      sourceA: "語彙ソース",
      sourceB: "文法ソース",
    },
    cta: {
      title: "少し学んでみますか？",
      description: "最初のレッスン、クイズ、Kamiへの質問をすぐ試せます。",
      primary: "学習を始める",
      secondary: "アカウント登録",
    },
  },
}

export default function LandingPage() {
  const { locale } = useI18n()
  const copy = locale === "ja" ? landingCopy.ja : landingCopy.vi
  const [articles, setArticles] = useState<LandingArticle[]>([])

  useEffect(() => {
    let cancelled = false

    fetch("/api/reading", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload || !Array.isArray(payload.items)) return
        setArticles(payload.items.slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setArticles([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main data-i18n-managed className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/86 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <span className="text-sm font-bold">日</span>
            </div>
            <span className="text-sm font-semibold">Nihongo AI Study</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-red-700">
              {copy.nav.features}
            </a>
            <a href="#reading" className="text-sm text-muted-foreground transition hover:text-red-700">
              {copy.nav.reading}
            </a>
            <a href="#recommendation" className="text-sm text-muted-foreground transition hover:text-red-700">
              {copy.nav.plan}
            </a>
            <a href="#admin" className="text-sm text-muted-foreground transition hover:text-red-700">
              {copy.nav.admin}
            </a>
            <a href="#chatbot" className="text-sm text-muted-foreground transition hover:text-red-700">
              {copy.nav.kami}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{copy.nav.login}</Link>
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
              <Link href="/register">{copy.nav.register}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden border-b bg-[#fbf5ee] bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,250,245,0.96) 0%, rgba(255,250,245,0.82) 46%, rgba(255,250,245,0.34) 100%), url('/assets/wallpaper.png')",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
              {copy.hero.badge}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-balance sm:text-5xl">
                {copy.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {copy.hero.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/dashboard">
                  {copy.hero.primary}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="#features">{copy.hero.secondary}</a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-white/70 bg-white/82 p-4 shadow-[0_20px_60px_rgba(87,50,39,0.16)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(87,50,39,0.20)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard className="h-4 w-4 text-red-600" />
                {copy.preview.title}
              </div>
              <Badge variant="outline">{copy.preview.level}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.preview.cards.map((item) => (
                <Card key={item.label} className={`group border transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold transition group-hover:translate-x-0.5">{item.value}</p>
                    <p className="text-sm font-medium">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 rounded-lg border bg-white/88 p-4 transition hover:border-green-200 hover:bg-white">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{copy.preview.progressTitle}</span>
                <span className="text-green-600">{copy.preview.progressMeta}</span>
              </div>
              <Progress value={68} className="h-2" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{copy.preview.progressLeft}</span>
                <span>{copy.preview.progressRight}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-red-600">{copy.features.kicker}</p>
            <h2 className="text-3xl font-bold">{copy.features.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.features.description}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.items.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border bg-background shadow-none transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_45px_rgba(123,58,43,0.12)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-red-500 opacity-0 transition group-hover:opacity-100" />
                <CardContent className="p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 transition duration-200 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white">
                    <feature.icon className="h-5 w-5 transition group-hover:rotate-3" />
                  </div>
                  <h3 className="font-semibold transition group-hover:text-red-700">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {articles.length > 0 && (
        <section id="reading" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="mb-2 text-sm font-semibold text-red-600">{copy.reading.kicker}</p>
                <h2 className="text-3xl font-bold">{copy.reading.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.reading.description}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/reading">{copy.nav.reading}</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/reading?article=${encodeURIComponent(article.id)}`}
                  className="group block overflow-hidden rounded-lg border bg-background shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_45px_rgba(123,58,43,0.14)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#fbf5ee]">
                    <img
                      src={article.imageUrl || "/assets/wallpaper.png"}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-black/4 to-transparent" />
                    <Badge className="absolute left-4 top-4 bg-white/90 text-red-700 hover:bg-white">
                      {article.level}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 text-red-600" />
                      <span className="truncate">{article.category || copy.reading.fallbackCategory}</span>
                    </div>
                    <h3 className="line-clamp-2 font-semibold leading-6 group-hover:text-red-700">{article.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {article.articleText}
                    </p>
                    <div className="mt-5 flex items-center text-sm font-medium text-red-700">
                      {copy.reading.action}
                      <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="recommendation" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
              {copy.plan.badge}
            </Badge>
            <h2 className="text-3xl font-bold">{copy.plan.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {copy.plan.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {copy.plan.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {copy.plan.items.map((item) => (
              <div key={item.title} className="group rounded-lg border bg-background p-4 transition duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-[0_14px_35px_rgba(52,112,74,0.10)]">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium transition group-hover:text-green-700">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <span className="text-sm font-semibold">{item.value}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admin" className="border-y bg-muted/30 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="rounded-lg border bg-background shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(55,83,132,0.10)]">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-blue-600" />
                {copy.admin.title}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-3 w-3" />
                  JSON
                </Button>
                <Button size="sm">{copy.admin.add}</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">{copy.admin.type}</th>
                    <th className="px-4 py-3 font-medium">{copy.admin.content}</th>
                    <th className="px-4 py-3 font-medium">{copy.admin.status}</th>
                    <th className="px-4 py-3 font-medium">{copy.admin.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {copy.admin.rows.map((row) => (
                    <tr key={row.item} className="border-b transition hover:bg-blue-50/60 last:border-0">
                      <td className="px-4 py-3"><Badge variant="outline">{row.type}</Badge></td>
                      <td className="px-4 py-3 font-medium">{row.item}</td>
                      <td className="px-4 py-3 text-green-600">{row.status}</td>
                      <td className="px-4 py-3 text-blue-600">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
              {copy.admin.badge}
            </Badge>
            <h2 className="text-3xl font-bold">{copy.admin.heading}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {copy.admin.description}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.admin.bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="chatbot" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
              {copy.kami.badge}
            </Badge>
            <h2 className="text-3xl font-bold">{copy.kami.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {copy.kami.description}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="group rounded-lg border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm">
                <Database className="mb-2 h-5 w-5 text-indigo-600 transition group-hover:scale-110" />
                <p className="font-medium transition group-hover:text-indigo-700">{copy.kami.retrieval}</p>
                <p className="text-sm text-muted-foreground">{copy.kami.retrievalDesc}</p>
              </div>
              <div className="group rounded-lg border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm">
                <Brain className="mb-2 h-5 w-5 text-indigo-600 transition group-hover:scale-110" />
                <p className="font-medium transition group-hover:text-indigo-700">{copy.kami.generation}</p>
                <p className="text-sm text-muted-foreground">{copy.kami.generationDesc}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-background shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_rgba(71,68,128,0.12)]">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Kami</span>
            </div>
            <div className="space-y-4 p-4">
              <div className="ml-auto max-w-[80%] rounded-lg bg-indigo-600 px-4 py-3 text-sm text-white">
                {copy.kami.question}
              </div>
              <div className="max-w-[88%] rounded-lg bg-muted px-4 py-3 text-sm leading-6">
                <p>{copy.kami.answer}</p>
                <p className="mt-2 text-muted-foreground">{copy.kami.example}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{copy.kami.sourceA}</Badge>
                <Badge variant="secondary">{copy.kami.sourceB}</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-red-400" />
          <h2 className="text-3xl font-bold">{copy.cta.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {copy.cta.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button className="bg-red-600 hover:bg-red-700" asChild>
              <Link href="/dashboard">{copy.cta.primary}</Link>
            </Button>
            <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" asChild>
              <Link href="/register">{copy.cta.secondary}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
