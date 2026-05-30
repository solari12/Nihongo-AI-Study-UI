"use client"

import Image from "next/image"
import { useState } from "react"
import { GrammarCard } from "@/components/app/grammar-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, FileText, Layers3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { grammarFilters } from "@/lib/data/nihongo-study"
import { useAdminContent } from "@/hooks/use-admin-content"
import { ContentErrorAlert, ContentLoadingCard } from "@/components/app/content-state"

const paperCardStyle = {
  backgroundColor: "transparent",
  backgroundImage: "url('/assets/paper-card-bg-clean.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
} as const

export default function GrammarPage() {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả")
  const { content, isLoaded, error } = useAdminContent()
  const completedCount = content.grammar.filter((grammar) => grammar.status === "Đã hoàn thành").length
  const inProgressCount = content.grammar.filter((grammar) => grammar.status === "Đang học").length

  const filteredGrammar = content.grammar.filter((grammar) => {
    if (selectedFilter === "Tất cả") return true
    return grammar.status === selectedFilter
  })

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <Image
            src="/assets/grammar-card-clean.png"
            alt=""
            width={360}
            height={260}
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -bottom-16 hidden h-64 w-64 object-contain opacity-85 md:block"
          />
          <div className="relative max-w-2xl">
            <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">Ngữ pháp N5</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Mẫu câu nền tảng</h1>
            <p className="mt-2 text-base leading-7 text-[#4f403b]">
              Học các cấu trúc N5 theo trạng thái, ví dụ và ghi chú sử dụng để dễ đưa vào lộ trình cá nhân.
            </p>
          </div>
        </section>

        {error && <ContentErrorAlert message={error} />}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-2 shadow-sm">
              {grammarFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "rounded-full",
                    selectedFilter === filter && "bg-[#702f2a] text-white hover:bg-[#5d2723]"
                  )}
                >
                  {filter}
                  <span className="ml-1 text-xs opacity-75">
                    {filter === "Tất cả"
                      ? `(${content.grammar.length})`
                      : `(${content.grammar.filter((grammar) => grammar.status === filter).length})`}
                  </span>
                </Button>
              ))}
            </div>

            {!isLoaded ? (
              <ContentLoadingCard label="Đang tải ngữ pháp..." />
            ) : (
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
            )}

            {isLoaded && filteredGrammar.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-[#8f4742]" />
                <h3 className="font-semibold">Không có ngữ pháp nào</h3>
                <p className="text-sm text-[#6f5952]">Chọn bộ lọc khác để xem thêm</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="border-none bg-transparent shadow-none" style={paperCardStyle}>
              <CardContent className="space-y-4 px-8 py-8">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-[#8f4742]" />
                  <h2 className="text-lg font-bold">Tổng quan</h2>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-3">
                    <span>Tổng mẫu</span>
                    <strong>{content.grammar.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-3">
                    <span>Đang học</span>
                    <strong>{inProgressCount}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-3">
                    <span>Hoàn thành</span>
                    <strong>{completedCount}</strong>
                  </div>
                </div>
                <div className="rounded-lg bg-[#dcebd9]/70 px-4 py-3 text-sm text-[#315d41]">
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Mỗi mẫu đã có chunk để chatbot truy xuất khi hỏi về ngữ pháp.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
