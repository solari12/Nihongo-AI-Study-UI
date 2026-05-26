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
import { useStudyProgress } from "@/hooks/use-study-progress"
import { useAdminContent } from "@/hooks/use-admin-content"
import { useActivityLog } from "@/hooks/use-activity-log"

export default function VocabularyPage() {
  const [selectedTopic, setSelectedTopic] = useState("Tất cả")
  const [searchQuery, setSearchQuery] = useState("")
  const { content, topics } = useAdminContent()
  const {
    learnedVocabularySet,
    stats,
    markVocabularyLearned,
    addVocabularyToReview,
  } = useStudyProgress()
  const { addActivity } = useActivityLog()

  const filteredVocabulary = content.vocabulary.filter((vocab) => {
    const matchesTopic = selectedTopic === "Tất cả" || vocab.topic === selectedTopic
    const normalizedSearch = searchQuery.toLowerCase()
    const matchesSearch =
      vocab.japanese.includes(searchQuery) ||
      vocab.hiragana.includes(searchQuery) ||
      vocab.romaji.toLowerCase().includes(normalizedSearch) ||
      vocab.vietnamese.toLowerCase().includes(normalizedSearch)

    return matchesTopic && matchesSearch
  })

  const totalVocabulary = content.vocabulary.length || stats.totalVocabulary
  const progressValue = Math.round((stats.learnedVocabulary / totalVocabulary) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Từ vựng N5</h1>
        <p className="text-muted-foreground">
          Học và ôn tập từ vựng tiếng Nhật N5
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm từ vựng..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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
                isLearned={learnedVocabularySet.has(vocab.id)}
                onMarkLearned={() => {
                  markVocabularyLearned(vocab.id)
                  addActivity({
                    type: "vocabulary",
                    content: `Học từ vựng: ${vocab.japanese} - ${vocab.vietnamese}`,
                    topic: vocab.topic,
                    result: "Đã học",
                    durationMinutes: 5,
                  })
                }}
                onAddToReview={() => {
                  addVocabularyToReview(vocab.id)
                  addActivity({
                    type: "review",
                    content: `Thêm vào ôn tập: ${vocab.japanese} - ${vocab.vietnamese}`,
                    topic: vocab.topic,
                    result: "Cần ôn",
                    durationMinutes: 1,
                  })
                }}
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

        <div className="space-y-4">
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
                <Badge variant="secondary">{totalVocabulary}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">Đã học</span>
                </div>
                <Badge className="bg-success/10 text-success">
                  {stats.learnedVocabulary}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-accent" />
                  <span className="text-sm">Cần ôn tập</span>
                </div>
                <Badge className="bg-accent/10 text-accent">
                  {stats.reviewVocabulary}
                </Badge>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Tiến độ</span>
                  <span className="text-muted-foreground">{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            </CardContent>
          </Card>

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
                Ôn tập ({stats.reviewVocabulary} từ)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
