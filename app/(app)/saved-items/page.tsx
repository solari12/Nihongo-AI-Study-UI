"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, BookmarkCheck, FileText, Loader2, PlayCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isUsefulSavedStudyItem, type SavedStudyItem } from "@/lib/saved-study-items"
import { cn } from "@/lib/utils"

type Filter = "all" | SavedStudyItem["type"]

export default function SavedItemsPage() {
  const [items, setItems] = useState<SavedStudyItem[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      try {
        const response = await fetch("/api/saved-study-items", { cache: "no-store" })
        if (!response.ok) throw new Error("Không tải được mục đã lưu")
        const data = (await response.json()) as { items: SavedStudyItem[] }
        if (!cancelled) setItems(data.items.filter(isUsefulSavedStudyItem))
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Không tải được mục đã lưu")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadItems()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredItems = useMemo(
    () => items.filter((item) => filter === "all" || item.type === filter),
    [filter, items]
  )
  const vocabularyCount = items.filter((item) => item.type === "vocabulary").length
  const grammarCount = items.filter((item) => item.type === "grammar").length

  async function removeItem(item: SavedStudyItem) {
    if (!window.confirm(`Bỏ “${item.title}” khỏi danh sách ôn tập?`)) return

    setDeletingId(item.id)
    setError(null)
    try {
      const response = await fetch(`/api/saved-study-items?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Không thể bỏ mục đã lưu")
      setItems((current) => current.filter((savedItem) => savedItem.id !== item.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể bỏ mục đã lưu")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div data-i18n-managed className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
                <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" />
                Bộ sưu tập cá nhân
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Ôn tập đã lưu</h1>
              <p className="mt-2 text-[#6f5952]">Các từ vựng và mẫu ngữ pháp bạn lưu từ bài đọc hoặc Kami.</p>
            </div>
            <Button asChild className="rounded-full bg-[#702f2a] text-white hover:bg-[#5d2723]">
              <Link href="/quiz?mode=saved">
                <PlayCircle className="mr-2 h-5 w-5" />
                Quiz từ mục đã lưu
              </Link>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {([
            ["all", `Tất cả (${items.length})`],
            ["vocabulary", `Từ vựng (${vocabularyCount})`],
            ["grammar", `Ngữ pháp (${grammarCount})`],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full border-[#dfb6aa] bg-white/70",
                filter === value && "border-[#702f2a] bg-[#702f2a] text-white hover:bg-[#5d2723] hover:text-white"
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center text-[#8f4742]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải mục đã lưu...
          </div>
        ) : filteredItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-[#dfb6aa] bg-[#fffdf8]/95 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8f4742]">
                        {item.type === "vocabulary" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {item.type === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}
                      </div>
                      <h2 className="mt-2 break-words text-xl font-bold text-[#2a211f]">{item.title}</h2>
                      {item.reading && <p className="mt-1 font-['Noto_Sans_JP',sans-serif] text-sm text-[#6f5952]">{item.reading}</p>}
                    </div>
                    {item.level && <Badge className="shrink-0 bg-[#f3c8bd] text-[#702f2a] hover:bg-[#f3c8bd]">{item.level}</Badge>}
                  </div>

                  {item.meaning && <p className="mt-4 text-sm leading-6 text-[#4f403b]">{item.meaning}</p>}
                  {item.note && <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>}
                  {item.example && (
                    <p className="mt-3 rounded-lg bg-white/75 p-3 font-['Noto_Sans_JP',sans-serif] text-sm leading-6 text-[#3f302b]">{item.example}</p>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => void removeItem(item)}
                    className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deletingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Bỏ lưu
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#dfb6aa] bg-white/55 px-6 py-14 text-center">
            <BookmarkCheck className="mx-auto h-10 w-10 text-[#b07369]" />
            <h2 className="mt-4 text-lg font-semibold text-[#2a211f]">Chưa có mục phù hợp</h2>
            <p className="mt-2 text-sm text-[#6f5952]">Mở một bài đọc và bấm “Lưu học” để thêm nội dung vào đây.</p>
          </div>
        )}
      </div>
    </div>
  )
}
