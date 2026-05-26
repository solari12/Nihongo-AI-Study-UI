"use client"

import { useState } from "react"
import { GrammarCard } from "@/components/app/grammar-card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const filters = ["Tất cả", "Chưa học", "Đang học", "Đã hoàn thành"]

const grammarData = [
  {
    id: 1,
    pattern: "N は N です",
    meaning: "N là N",
    structure: "Danh từ 1 + は + Danh từ 2 + です",
    example: {
      japanese: "私は学生です。",
      vietnamese: "Tôi là sinh viên.",
    },
    usageNote: "Dùng để giới thiệu bản thân hoặc nói về đặc điểm của ai/cái gì đó.",
    difficulty: "Dễ" as const,
    status: "Đã hoàn thành" as const,
  },
  {
    id: 2,
    pattern: "N じゃありません",
    meaning: "Không phải là N",
    structure: "Danh từ + じゃありません / ではありません",
    example: {
      japanese: "私は先生じゃありません。",
      vietnamese: "Tôi không phải là giáo viên.",
    },
    usageNote: "Thể phủ định của です. じゃありません là cách nói thông thường, ではありません là cách nói lịch sự hơn.",
    difficulty: "Dễ" as const,
    status: "Đang học" as const,
  },
  {
    id: 3,
    pattern: "これ / それ / あれ",
    meaning: "Cái này / Cái đó / Cái kia",
    structure: "これ/それ/あれ + は + N + です",
    example: {
      japanese: "これは本です。",
      vietnamese: "Cái này là sách.",
    },
    usageNote: "これ: gần người nói, それ: gần người nghe, あれ: xa cả hai người.",
    difficulty: "Dễ" as const,
    status: "Đã hoàn thành" as const,
  },
  {
    id: 4,
    pattern: "〜ます / 〜ません",
    meaning: "Thể lịch sự khẳng định/phủ định của động từ",
    structure: "Động từ (thể ます) / Động từ (thể ません)",
    example: {
      japanese: "毎日日本語を勉強します。",
      vietnamese: "Hàng ngày tôi học tiếng Nhật.",
    },
    usageNote: "Thể ます dùng trong giao tiếp lịch sự. ません là thể phủ định.",
    difficulty: "Trung bình" as const,
    status: "Đang học" as const,
  },
  {
    id: 5,
    pattern: "N を V ます",
    meaning: "Làm gì đó (với đối tượng N)",
    structure: "Danh từ + を + Động từ (thể ます)",
    example: {
      japanese: "本を読みます。",
      vietnamese: "Tôi đọc sách.",
    },
    usageNote: "Trợ từ を đánh dấu tân ngữ trực tiếp của động từ.",
    difficulty: "Trung bình" as const,
    status: "Chưa học" as const,
  },
  {
    id: 6,
    pattern: "N に V ます",
    meaning: "Làm gì đó (tại địa điểm/thời điểm N)",
    structure: "Danh từ (địa điểm/thời gian) + に + Động từ",
    example: {
      japanese: "7時に起きます。",
      vietnamese: "Tôi dậy lúc 7 giờ.",
    },
    usageNote: "Trợ từ に dùng để chỉ thời điểm cụ thể hoặc điểm đến.",
    difficulty: "Trung bình" as const,
    status: "Chưa học" as const,
  },
  {
    id: 7,
    pattern: "どこ / なに / だれ",
    meaning: "Ở đâu / Cái gì / Ai",
    structure: "Từ nghi vấn + ですか",
    example: {
      japanese: "これは何ですか。",
      vietnamese: "Đây là cái gì?",
    },
    usageNote: "Các từ nghi vấn cơ bản trong tiếng Nhật.",
    difficulty: "Dễ" as const,
    status: "Đã hoàn thành" as const,
  },
  {
    id: 8,
    pattern: "〜ましょう",
    meaning: "Hãy cùng làm...",
    structure: "Động từ (bỏ ます) + ましょう",
    example: {
      japanese: "一緒に食べましょう。",
      vietnamese: "Hãy cùng ăn nào.",
    },
    usageNote: "Dùng để rủ rê, đề nghị cùng làm gì đó.",
    difficulty: "Trung bình" as const,
    status: "Chưa học" as const,
  },
]

export default function GrammarPage() {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả")

  const filteredGrammar = grammarData.filter((grammar) => {
    if (selectedFilter === "Tất cả") return true
    return grammar.status === selectedFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ngữ pháp N5</h1>
        <p className="text-muted-foreground">
          Học các mẫu ngữ pháp tiếng Nhật N5
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              selectedFilter === filter && "bg-primary text-primary-foreground"
            )}
          >
            {filter}
            {filter !== "Tất cả" && (
              <span className="ml-1 text-xs opacity-70">
                ({grammarData.filter((g) => g.status === filter).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Grammar grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredGrammar.map((grammar) => (
          <GrammarCard
            key={grammar.id}
            pattern={grammar.pattern}
            meaning={grammar.meaning}
            structure={grammar.structure}
            example={grammar.example}
            usageNote={grammar.usageNote}
            difficulty={grammar.difficulty}
            status={grammar.status}
          />
        ))}
      </div>

      {filteredGrammar.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Không có ngữ pháp nào</h3>
          <p className="text-sm text-muted-foreground">
            Chọn bộ lọc khác để xem thêm
          </p>
        </div>
      )}
    </div>
  )
}
