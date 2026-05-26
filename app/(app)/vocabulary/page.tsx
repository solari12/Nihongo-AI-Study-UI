"use client"

import { useState } from "react"
import { VocabularyCard } from "@/components/app/vocabulary-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, BookOpen, CheckCircle2, RefreshCw, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const topics = [
  "Tất cả",
  "Chào hỏi",
  "Gia đình",
  "Trường học",
  "Thời gian",
  "Đồ vật",
  "Động từ",
  "Tính từ",
]

const vocabularyData = [
  {
    id: 1,
    japanese: "学生",
    hiragana: "がくせい",
    romaji: "gakusei",
    vietnamese: "sinh viên",
    type: "Danh từ",
    topic: "Trường học",
    example: {
      japanese: "私は学生です。",
      vietnamese: "Tôi là sinh viên.",
    },
    isLearned: true,
  },
  {
    id: 2,
    japanese: "先生",
    hiragana: "せんせい",
    romaji: "sensei",
    vietnamese: "giáo viên",
    type: "Danh từ",
    topic: "Trường học",
    example: {
      japanese: "田中さんは先生です。",
      vietnamese: "Anh Tanaka là giáo viên.",
    },
    isLearned: true,
  },
  {
    id: 3,
    japanese: "日本",
    hiragana: "にほん",
    romaji: "nihon",
    vietnamese: "Nhật Bản",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "日本は美しい国です。",
      vietnamese: "Nhật Bản là đất nước xinh đẹp.",
    },
    isLearned: false,
  },
  {
    id: 4,
    japanese: "本",
    hiragana: "ほん",
    romaji: "hon",
    vietnamese: "sách",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "これは私の本です。",
      vietnamese: "Đây là sách của tôi.",
    },
    isLearned: false,
  },
  {
    id: 5,
    japanese: "水",
    hiragana: "みず",
    romaji: "mizu",
    vietnamese: "nước",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "水をください。",
      vietnamese: "Cho tôi xin nước.",
    },
    isLearned: true,
  },
  {
    id: 6,
    japanese: "食べる",
    hiragana: "たべる",
    romaji: "taberu",
    vietnamese: "ăn",
    type: "Động từ",
    topic: "Động từ",
    example: {
      japanese: "朝ごはんを食べます。",
      vietnamese: "Tôi ăn bữa sáng.",
    },
    isLearned: false,
  },
  {
    id: 7,
    japanese: "大きい",
    hiragana: "おおきい",
    romaji: "ookii",
    vietnamese: "to, lớn",
    type: "Tính từ",
    topic: "Tính từ",
    example: {
      japanese: "この家は大きいです。",
      vietnamese: "Ngôi nhà này to.",
    },
    isLearned: false,
  },
  {
    id: 8,
    japanese: "父",
    hiragana: "ちち",
    romaji: "chichi",
    vietnamese: "bố (của mình)",
    type: "Danh từ",
    topic: "Gia đình",
    example: {
      japanese: "父は会社員です。",
      vietnamese: "Bố tôi là nhân viên công ty.",
    },
    isLearned: true,
  },
]

export default function VocabularyPage() {
  const [selectedTopic, setSelectedTopic] = useState("Tất cả")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredVocabulary = vocabularyData.filter((vocab) => {
    const matchesTopic = selectedTopic === "Tất cả" || vocab.topic === selectedTopic
    const matchesSearch =
      vocab.japanese.includes(searchQuery) ||
      vocab.hiragana.includes(searchQuery) ||
      vocab.romaji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.vietnamese.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTopic && matchesSearch
  })

  const totalWords = vocabularyData.length
  const learnedWords = vocabularyData.filter((v) => v.isLearned).length
  const reviewWords = 5 // Mock data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Từ vựng N5</h1>
        <p className="text-muted-foreground">
          Học và ôn tập từ vựng tiếng Nhật N5
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm từ vựng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Topic filters */}
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Button
                key={topic}
                variant={selectedTopic === topic ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTopic(topic)}
                className={cn(
                  selectedTopic === topic && "bg-primary text-primary-foreground"
                )}
              >
                {topic}
              </Button>
            ))}
          </div>

          {/* Vocabulary grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredVocabulary.map((vocab) => (
              <VocabularyCard
                key={vocab.id}
                japanese={vocab.japanese}
                hiragana={vocab.hiragana}
                romaji={vocab.romaji}
                vietnamese={vocab.vietnamese}
                type={vocab.type}
                example={vocab.example}
                isLearned={vocab.isLearned}
              />
            ))}
          </div>

          {filteredVocabulary.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">Không tìm thấy từ vựng</h3>
              <p className="text-sm text-muted-foreground">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thống kê từ vựng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm">Tổng số từ</span>
                </div>
                <Badge variant="secondary">{totalWords}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">Đã học</span>
                </div>
                <Badge className="bg-success/10 text-success">{learnedWords}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-accent" />
                  <span className="text-sm">Cần ôn tập</span>
                </div>
                <Badge className="bg-accent/10 text-accent">{reviewWords}</Badge>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Tiến độ</span>
                  <span className="text-muted-foreground">
                    {Math.round((learnedWords / totalWords) * 100)}%
                  </span>
                </div>
                <Progress value={(learnedWords / totalWords) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Quick practice */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Luyện tập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="default">
                <PlayCircle className="mr-2 h-4 w-4" />
                Học từ mới
              </Button>
              <Button className="w-full" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Ôn tập ({reviewWords} từ)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
