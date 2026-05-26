"use client"

import Link from "next/link"
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

const features = [
  {
    icon: BookOpen,
    title: "Học từ vựng N5",
    description: "Quản lý từ vựng với kana, romaji, nghĩa tiếng Việt, ví dụ và trạng thái ôn tập.",
  },
  {
    icon: FileText,
    title: "Học ngữ pháp N5",
    description: "Giải thích mẫu câu, cấu trúc, cách dùng và ví dụ phù hợp người mới học.",
  },
  {
    icon: ClipboardList,
    title: "Quiz kiểm tra kiến thức",
    description: "Làm bài trắc nghiệm theo từ vựng, ngữ pháp hoặc tổng hợp và lưu kết quả.",
  },
  {
    icon: History,
    title: "Lịch sử học tập",
    description: "Ghi lại hoạt động học từ, ôn tập, điểm quiz và thời lượng học theo ngày.",
  },
  {
    icon: LineChart,
    title: "Gợi ý lộ trình học",
    description: "Phân tích hành vi bằng BKT, SM-2 và activity log để đề xuất bài tiếp theo.",
  },
  {
    icon: Bot,
    title: "Chatbot AI RAG",
    description: "Truy xuất nguồn từ dữ liệu N5 trước khi trả lời qua OpenRouter hoặc fallback.",
  },
]

const recommendations = [
  {
    title: "Ôn tập từ vựng cần nhớ",
    meta: "SM-2 · Activity Log",
    value: 72,
    color: "bg-red-500",
  },
  {
    title: "Làm quiz củng cố chủ đề yếu",
    meta: "BKT · Quiz Score",
    value: 58,
    color: "bg-amber-500",
  },
  {
    title: "Học ngữ pháp tiếp theo",
    meta: "Learning Path · N5",
    value: 84,
    color: "bg-blue-500",
  },
]

const adminRows = [
  { type: "Từ vựng", item: "電話 / でんわ", action: "Sửa", status: "Đang dùng" },
  { type: "Ngữ pháp", item: "N は N です", action: "Sửa", status: "Đang dùng" },
  { type: "Quiz", item: "学生 nghĩa là gì?", action: "Xem", status: "Đang dùng" },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <span className="text-sm font-bold">日</span>
            </div>
            <span className="text-sm font-semibold">Nihongo AI Study</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Chức năng
            </a>
            <a href="#recommendation" className="text-sm text-muted-foreground hover:text-foreground">
              AI gợi ý
            </a>
            <a href="#admin" className="text-sm text-muted-foreground hover:text-foreground">
              Quản trị
            </a>
            <a href="#chatbot" className="text-sm text-muted-foreground hover:text-foreground">
              Chatbot
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
              <Link href="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
              Đồ án học tiếng Nhật N5 tích hợp AI
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-balance sm:text-5xl">
                Ứng dụng học tiếng Nhật N5 với AI và lộ trình cá nhân hóa
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Nền tảng hỗ trợ học từ vựng, ngữ pháp, quiz, lịch sử học tập, quản trị nội dung,
                chatbot RAG và hệ khuyến nghị dựa trên hành vi người dùng.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/dashboard">
                  Vào học ngay
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="#features">Xem chức năng</a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard className="h-4 w-4 text-red-600" />
                Bản xem trước hệ thống
              </div>
              <Badge variant="outline">N5 Beginner</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Từ vựng", value: "語彙", tone: "border-red-200 bg-red-50 text-red-700" },
                { label: "Ngữ pháp", value: "文法", tone: "border-blue-200 bg-blue-50 text-blue-700" },
                { label: "Quiz", value: "試験", tone: "border-amber-200 bg-amber-50 text-amber-700" },
                { label: "AI gợi ý", value: "AI", tone: "border-green-200 bg-green-50 text-green-700" },
              ].map((item) => (
                <Card key={item.label} className={`border ${item.tone}`}>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm font-medium">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 rounded-lg border bg-background p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Tiến độ hôm nay</span>
                <span className="text-green-600">+12 từ mới</span>
              </div>
              <Progress value={68} className="h-2" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>68% mục tiêu N5</span>
                <span>Quiz gần nhất: 84%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold text-red-600">Chức năng chính</p>
            <h2 className="text-3xl font-bold">Một hệ thống học N5 hoàn chỉnh để demo đồ án</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Các module được kết nối thành một luồng: nhập nội dung, học, làm quiz, ghi lịch sử và nhận gợi ý.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-none">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="recommendation" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
              BKT + SM-2 + Activity Log
            </Badge>
            <h2 className="text-3xl font-bold">Hệ khuyến nghị giải thích được</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Hệ thống phân tích từ đã học, danh sách ôn tập, điểm quiz và lịch sử hoạt động để
              tạo gợi ý học tiếp theo. Mỗi gợi ý có điểm ưu tiên và lý do để dễ trình bày trong báo cáo.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Bayesian Knowledge Tracing", "Spaced repetition", "Priority score", "Explanation"].map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.title} className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.title}</p>
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
          <div className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4 text-blue-600" />
                Quản lý nội dung
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-3 w-3" />
                  JSON
                </Button>
                <Button size="sm">Thêm</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Loại</th>
                    <th className="px-4 py-3 font-medium">Nội dung</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRows.map((row) => (
                    <tr key={row.item} className="border-b last:border-0">
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
              Admin content manager
            </Badge>
            <h2 className="text-3xl font-bold">Bạn tự xây bộ dữ liệu N5 cho hệ thống</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Admin có thể thêm, sửa, xóa từ vựng, ngữ pháp, câu hỏi quiz và import/export JSON.
              Dữ liệu vừa nhập sẽ được dùng ngay trong học tập, quiz, chatbot và hệ khuyến nghị.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["CRUD từ vựng/ngữ pháp/quiz", "Import/export JSON để backup", "Dữ liệu dùng chung cho toàn app"].map((item) => (
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
              Retrieval-Augmented Generation
            </Badge>
            <h2 className="text-3xl font-bold">Chatbot trả lời có nguồn tham khảo</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Chatbot truy xuất dữ liệu từ vocabulary, grammar và quiz trước khi gọi OpenRouter.
              Nếu thiếu API key hoặc lỗi mạng, hệ thống dùng fallback template để demo vẫn chạy.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <Database className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="font-medium">Retrieval</p>
                <p className="text-sm text-muted-foreground">Tìm nguồn liên quan trong dữ liệu N5.</p>
              </div>
              <div className="rounded-lg border p-4">
                <Brain className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="font-medium">Generation</p>
                <p className="text-sm text-muted-foreground">Sinh câu trả lời bằng prompt có ngữ cảnh.</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-background shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Nihongo AI Assistant</span>
            </div>
            <div className="space-y-4 p-4">
              <div className="ml-auto max-w-[80%] rounded-lg bg-indigo-600 px-4 py-3 text-sm text-white">
                学生 nghĩa là gì?
              </div>
              <div className="max-w-[88%] rounded-lg bg-muted px-4 py-3 text-sm leading-6">
                <p>
                  学生 (がくせい / gakusei) nghĩa là sinh viên hoặc học sinh.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Ví dụ: 私は学生です。= Tôi là sinh viên.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Vocabulary source</Badge>
                <Badge variant="secondary">Grammar source</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-red-400" />
          <h2 className="text-3xl font-bold">Sẵn sàng xem bản demo?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Trải nghiệm luồng học tập đầy đủ: admin nhập dữ liệu, người học làm quiz, lịch sử ghi nhận
            hành vi và AI đề xuất lộ trình cá nhân hóa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button className="bg-red-600 hover:bg-red-700" asChild>
              <Link href="/dashboard">Bắt đầu trải nghiệm</Link>
            </Button>
            <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" asChild>
              <Link href="/register">Đăng ký tài khoản</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
