"use client"

import { useState } from "react"
import { AdminDataTable, StatusBadge } from "@/components/app/admin-data-table"
import { StatsCard } from "@/components/app/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Settings,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// Mock data
const usersData = [
  { id: 1, name: "Nguyễn Văn A", email: "vana@example.com", class: "22SE1A", progress: "65%", status: "Hoạt động" },
  { id: 2, name: "Trần Thị B", email: "thib@example.com", class: "22SE1B", progress: "78%", status: "Hoạt động" },
  { id: 3, name: "Lê Văn C", email: "vanc@example.com", class: "22SE1A", progress: "45%", status: "Không hoạt động" },
  { id: 4, name: "Phạm Thị D", email: "thid@example.com", class: "22SE1C", progress: "82%", status: "Hoạt động" },
  { id: 5, name: "Hoàng Văn E", email: "vane@example.com", class: "22SE1B", progress: "55%", status: "Hoạt động" },
]

const vocabularyData = [
  { id: 1, japanese: "学生", hiragana: "がくせい", vietnamese: "sinh viên", type: "Danh từ", status: "Hoạt động" },
  { id: 2, japanese: "先生", hiragana: "せんせい", vietnamese: "giáo viên", type: "Danh từ", status: "Hoạt động" },
  { id: 3, japanese: "日本", hiragana: "にほん", vietnamese: "Nhật Bản", type: "Danh từ", status: "Hoạt động" },
  { id: 4, japanese: "本", hiragana: "ほん", vietnamese: "sách", type: "Danh từ", status: "Hoạt động" },
  { id: 5, japanese: "水", hiragana: "みず", vietnamese: "nước", type: "Danh từ", status: "Hoạt động" },
]

const grammarData = [
  { id: 1, pattern: "N は N です", meaning: "N là N", difficulty: "Dễ", status: "Hoạt động" },
  { id: 2, pattern: "N じゃありません", meaning: "Không phải là N", difficulty: "Dễ", status: "Hoạt động" },
  { id: 3, pattern: "これ/それ/あれ", meaning: "Cái này/đó/kia", difficulty: "Dễ", status: "Hoạt động" },
  { id: 4, pattern: "〜ます", meaning: "Thể lịch sự", difficulty: "Trung bình", status: "Hoạt động" },
  { id: 5, pattern: "〜ません", meaning: "Phủ định lịch sự", difficulty: "Trung bình", status: "Hoạt động" },
]

const quizData = [
  { id: 1, question: '"学生" nghĩa là gì?', type: "Từ vựng", difficulty: "Dễ", status: "Hoạt động" },
  { id: 2, question: 'Chọn cách đọc đúng của "先生"', type: "Từ vựng", difficulty: "Dễ", status: "Hoạt động" },
  { id: 3, question: 'Điền vào chỗ trống: "私___学生です"', type: "Ngữ pháp", difficulty: "Dễ", status: "Hoạt động" },
  { id: 4, question: '"水" nghĩa là gì?', type: "Từ vựng", difficulty: "Dễ", status: "Hoạt động" },
  { id: 5, question: 'Câu nào đúng để nói "Đây là sách"?', type: "Ngữ pháp", difficulty: "Trung bình", status: "Hoạt động" },
]

const chatbotQuestionsData = [
  { id: 1, question: "Giải thích mẫu câu N は N です", count: 45, category: "Ngữ pháp" },
  { id: 2, question: "Phân biệt は và が", count: 38, category: "Ngữ pháp" },
  { id: 3, question: "Cho ví dụ với từ 学生", count: 32, category: "Từ vựng" },
  { id: 4, question: "Tạo quiz nhanh", count: 28, category: "Quiz" },
  { id: 5, question: "Cách chia động từ nhóm 2", count: 25, category: "Ngữ pháp" },
]

const learningStatsData = [
  { day: "T2", users: 120, minutes: 450 },
  { day: "T3", users: 145, minutes: 520 },
  { day: "T4", users: 135, minutes: 480 },
  { day: "T5", users: 160, minutes: 600 },
  { day: "T6", users: 180, minutes: 720 },
  { day: "T7", users: 95, minutes: 380 },
  { day: "CN", users: 85, minutes: 320 },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Quản trị hệ thống
        </h1>
        <p className="text-muted-foreground">
          Quản lý nội dung và theo dõi hoạt động của người dùng
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng người dùng"
          value="256"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, label: "tháng này", positive: true }}
        />
        <StatsCard
          title="Từ vựng"
          value="500"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatsCard
          title="Mẫu ngữ pháp"
          value="45"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Câu hỏi quiz"
          value="320"
          icon={<HelpCircle className="h-5 w-5" />}
        />
      </div>

      {/* Learning stats chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Thống kê học tập tuần này
          </CardTitle>
          <CardDescription>
            Số người dùng và tổng thời gian học (phút) theo ngày
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningStatsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar yAxisId="left" dataKey="users" fill="hsl(var(--primary))" name="Người dùng" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="minutes" fill="hsl(var(--accent))" name="Phút học" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data management tabs */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="vocabulary">Từ vựng</TabsTrigger>
          <TabsTrigger value="grammar">Ngữ pháp</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminDataTable
            title="Quản lý người dùng"
            data={usersData}
            columns={[
              { key: "name", header: "Họ tên" },
              { key: "email", header: "Email" },
              { key: "class", header: "Lớp" },
              { key: "progress", header: "Tiến độ" },
              {
                key: "status",
                header: "Trạng thái",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            searchPlaceholder="Tìm người dùng..."
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            currentPage={1}
            totalPages={5}
          />
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-6">
          <AdminDataTable
            title="Quản lý từ vựng"
            data={vocabularyData}
            columns={[
              { key: "japanese", header: "Tiếng Nhật" },
              { key: "hiragana", header: "Hiragana" },
              { key: "vietnamese", header: "Tiếng Việt" },
              {
                key: "type",
                header: "Loại từ",
                render: (item) => (
                  <Badge variant="outline">{item.type}</Badge>
                ),
              },
              {
                key: "status",
                header: "Trạng thái",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            searchPlaceholder="Tìm từ vựng..."
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            currentPage={1}
            totalPages={10}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-6">
          <AdminDataTable
            title="Quản lý ngữ pháp"
            data={grammarData}
            columns={[
              { key: "pattern", header: "Mẫu câu" },
              { key: "meaning", header: "Ý nghĩa" },
              {
                key: "difficulty",
                header: "Độ khó",
                render: (item) => (
                  <Badge
                    className={
                      item.difficulty === "Dễ"
                        ? "bg-green-100 text-green-700"
                        : item.difficulty === "Trung bình"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {item.difficulty}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "Trạng thái",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            searchPlaceholder="Tìm ngữ pháp..."
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            currentPage={1}
            totalPages={2}
          />
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <AdminDataTable
            title="Quản lý câu hỏi quiz"
            data={quizData}
            columns={[
              { key: "question", header: "Câu hỏi" },
              {
                key: "type",
                header: "Loại",
                render: (item) => (
                  <Badge variant="outline">{item.type}</Badge>
                ),
              },
              {
                key: "difficulty",
                header: "Độ khó",
                render: (item) => (
                  <Badge
                    className={
                      item.difficulty === "Dễ"
                        ? "bg-green-100 text-green-700"
                        : item.difficulty === "Trung bình"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {item.difficulty}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "Trạng thái",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            searchPlaceholder="Tìm câu hỏi..."
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            currentPage={1}
            totalPages={8}
          />
        </TabsContent>

        <TabsContent value="chatbot" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Câu hỏi thường gặp từ Chatbot
              </CardTitle>
              <CardDescription>
                Các câu hỏi được hỏi nhiều nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chatbotQuestionsData.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{item.question}</p>
                        <Badge variant="outline" className="mt-1">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="text-xs text-muted-foreground">lượt hỏi</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
