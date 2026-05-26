"use client"

import { useState } from "react"
import { GrammarCard } from "@/components/app/grammar-card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { grammarFilters } from "@/lib/data/nihongo-study"
import { useAdminContent } from "@/hooks/use-admin-content"

export default function GrammarPage() {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả")
  const { content } = useAdminContent()

  const filteredGrammar = content.grammar.filter((grammar) => {
    if (selectedFilter === "Tất cả") return true
    return grammar.status === selectedFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ngữ pháp N5</h1>
        <p className="text-muted-foreground">
          Học các mẫu ngữ pháp tiếng Nhật N5
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {grammarFilters.map((filter) => (
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
                ({content.grammar.filter((grammar) => grammar.status === filter).length})
              </span>
            )}
          </Button>
        ))}
      </div>

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
