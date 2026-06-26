"use client"

import { ChangeEvent, FormEvent, type ReactNode, useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ContentErrorAlert, ContentLoadingCard } from "@/components/app/content-state"
import {
  BookOpen,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { isAdminContent, useAdminContent } from "@/hooks/use-admin-content"
import { useAuth } from "@/hooks/use-auth"
import type { GrammarItem, QuizQuestionItem, VocabularyItem } from "@/lib/data/nihongo-study"

const emptyVocabulary: Omit<VocabularyItem, "id"> = {
  japanese: "",
  hiragana: "",
  romaji: "",
  vietnamese: "",
  imageUrl: null,
  type: "Danh từ",
  topic: "Khác",
  example: {
    japanese: "",
    vietnamese: "",
  },
}

const emptyGrammar: Omit<GrammarItem, "id"> = {
  pattern: "",
  meaning: "",
  structure: "",
  example: {
    japanese: "",
    vietnamese: "",
  },
  usageNote: "",
  difficulty: "Dễ",
  status: "Chưa học",
}

const emptyQuiz: Omit<QuizQuestionItem, "id"> = {
  question: "",
  type: "vocabulary",
  difficulty: "easy",
  topic: "Khác",
  answers: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correctAnswer: "a",
  explanation: "",
}

type EditorMode = "create" | "edit"

const adminButtonClass =
  "rounded-full border-[#f0c4c0] bg-white/80 text-[#7a3f45] shadow-sm hover:bg-[#fff0ef] hover:text-[#c94955]"

const adminPrimaryButtonClass =
  "rounded-full bg-[#e96f78] text-white shadow-sm shadow-[#e96f78]/25 hover:bg-[#d94f5b]"

const adminPanelClass = "border-[#f0c4c0] bg-white/90 shadow-sm shadow-[#e96f78]/10"

export default function AdminPage() {
  const { activeUser } = useAuth()
  const {
    content,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    addGrammar,
    updateGrammar,
    deleteGrammar,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    resetContent,
    replaceContent,
    isLoaded,
    error,
  } = useAdminContent()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vocabularyDialogOpen, setVocabularyDialogOpen] = useState(false)
  const [grammarDialogOpen, setGrammarDialogOpen] = useState(false)
  const [quizDialogOpen, setQuizDialogOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>("create")
  const [vocabularyForm, setVocabularyForm] = useState<VocabularyItem | Omit<VocabularyItem, "id">>(emptyVocabulary)
  const [grammarForm, setGrammarForm] = useState<GrammarItem | Omit<GrammarItem, "id">>(emptyGrammar)
  const [quizForm, setQuizForm] = useState<QuizQuestionItem | Omit<QuizQuestionItem, "id">>(emptyQuiz)
  const [importMessage, setImportMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (activeUser?.role !== "admin") {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Cần quyền admin
            </CardTitle>
            <CardDescription>
              Trang này dùng để thêm, sửa, xóa và import/export dữ liệu học N5. Người học không có quyền chỉnh nội dung.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Quay lại dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const openNewVocabulary = () => {
    setEditorMode("create")
    setVocabularyForm(emptyVocabulary)
    setVocabularyDialogOpen(true)
  }

  const openEditVocabulary = (item: VocabularyItem) => {
    setEditorMode("edit")
    setVocabularyForm(item)
    setVocabularyDialogOpen(true)
  }

  const saveVocabulary = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if ("id" in vocabularyForm) {
        await updateVocabulary(vocabularyForm)
      } else {
        await addVocabulary(vocabularyForm)
      }
      setVocabularyDialogOpen(false)
      setImportMessage("Đã lưu từ vựng vào PostgreSQL.")
    } catch {
      setImportMessage("Không lưu được từ vựng. Hãy kiểm tra quyền admin hoặc dữ liệu nhập.")
    } finally {
      setIsSaving(false)
    }
  }

  const openNewGrammar = () => {
    setEditorMode("create")
    setGrammarForm(emptyGrammar)
    setGrammarDialogOpen(true)
  }

  const openEditGrammar = (item: GrammarItem) => {
    setEditorMode("edit")
    setGrammarForm(item)
    setGrammarDialogOpen(true)
  }

  const saveGrammar = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if ("id" in grammarForm) {
        await updateGrammar(grammarForm)
      } else {
        await addGrammar(grammarForm)
      }
      setGrammarDialogOpen(false)
      setImportMessage("Đã lưu ngữ pháp vào PostgreSQL.")
    } catch {
      setImportMessage("Không lưu được ngữ pháp. Hãy kiểm tra quyền admin hoặc dữ liệu nhập.")
    } finally {
      setIsSaving(false)
    }
  }

  const openNewQuiz = () => {
    setEditorMode("create")
    setQuizForm(emptyQuiz)
    setQuizDialogOpen(true)
  }

  const openEditQuiz = (item: QuizQuestionItem) => {
    setEditorMode("edit")
    setQuizForm(item)
    setQuizDialogOpen(true)
  }

  const saveQuiz = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if ("id" in quizForm) {
        await updateQuizQuestion(quizForm)
      } else {
        await addQuizQuestion(quizForm)
      }
      setQuizDialogOpen(false)
      setImportMessage("Đã lưu câu hỏi quiz vào PostgreSQL.")
    } catch {
      setImportMessage("Không lưu được câu hỏi quiz. Hãy kiểm tra quyền admin hoặc dữ liệu nhập.")
    } finally {
      setIsSaving(false)
    }
  }

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `nihongo-n5-content-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setImportMessage("Đã xuất dữ liệu nội dung N5.")
  }

  const removeVocabulary = async (id: number) => {
    setIsSaving(true)
    try {
      await deleteVocabulary(id)
      setImportMessage("Đã xóa từ vựng khỏi PostgreSQL.")
    } catch {
      setImportMessage("Không xóa được từ vựng.")
    } finally {
      setIsSaving(false)
    }
  }

  const removeGrammar = async (id: number) => {
    setIsSaving(true)
    try {
      await deleteGrammar(id)
      setImportMessage("Đã xóa ngữ pháp khỏi PostgreSQL.")
    } catch {
      setImportMessage("Không xóa được ngữ pháp.")
    } finally {
      setIsSaving(false)
    }
  }

  const removeQuiz = async (id: number) => {
    setIsSaving(true)
    try {
      await deleteQuizQuestion(id)
      setImportMessage("Đã xóa câu hỏi quiz khỏi PostgreSQL.")
    } catch {
      setImportMessage("Không xóa được câu hỏi quiz.")
    } finally {
      setIsSaving(false)
    }
  }

  const importContent = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      if (!isAdminContent(parsed)) {
        setImportMessage("File không đúng định dạng. Cần có vocabulary, grammar và quiz.")
        return
      }

      replaceContent(parsed)
      setImportMessage(
        `Đã nhập ${parsed.vocabulary.length} từ vựng, ${parsed.grammar.length} ngữ pháp, ${parsed.quiz.length} câu quiz.`
      )
    } catch {
      setImportMessage("Không đọc được file JSON. Hãy kiểm tra lại nội dung file.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-[#f3d7d2] bg-[#fff7f6] p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#f0c4c0] bg-white/85 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#7a3f45]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe7e4]">
              <Settings className="h-5 w-5 text-[#d94f5b]" />
            </span>
            Quản trị nội dung N5
          </h1>
          <p className="mt-2 text-sm text-[#8a6665]">
            Thêm và chỉnh sửa dữ liệu học tập. Dữ liệu được lưu trong PostgreSQL và đồng bộ cho trải nghiệm học.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importContent}
          />
          <Button variant="outline" className={adminButtonClass} onClick={() => fileInputRef.current?.click()} disabled={!isLoaded}>
            Nhập JSON
          </Button>
          <Button variant="outline" className={adminButtonClass} onClick={exportContent} disabled={!isLoaded}>
            Xuất JSON
          </Button>
          <Button variant="outline" className={adminButtonClass} onClick={resetContent} disabled={!isLoaded}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Khôi phục dữ liệu mẫu
          </Button>
        </div>
      </div>

      {error && <ContentErrorAlert message={error} />}

      {!isLoaded && <ContentLoadingCard label="Đang tải dữ liệu quản trị..." />}

      {importMessage && (
        <Card className={adminPanelClass}>
          <CardContent className="py-3 text-sm text-[#8a6665]">
            {importMessage}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard title="Từ vựng" value={content.vocabulary.length} subtitle="mục đang quản lý" icon={<BookOpen className="h-5 w-5" />} />
        <AdminStatCard title="Ngữ pháp" value={content.grammar.length} subtitle="mẫu câu" icon={<FileText className="h-5 w-5" />} />
        <AdminStatCard title="Quiz" value={content.quiz.length} subtitle="câu hỏi" icon={<HelpCircle className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="vocabulary">
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-full border border-[#f0c4c0] bg-[#fff0ef] p-1 text-[#8a6665]">
          <TabsTrigger value="vocabulary" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#c94955] data-[state=active]:shadow-sm">Từ vựng</TabsTrigger>
          <TabsTrigger value="grammar" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#c94955] data-[state=active]:shadow-sm">Ngữ pháp</TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#c94955] data-[state=active]:shadow-sm">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary" className="mt-6">
          <Card className={adminPanelClass}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[#7a3f45]">Danh sách từ vựng</CardTitle>
                <CardDescription className="text-[#9a7472]">Nhập dần bộ từ vựng N5 theo chủ đề.</CardDescription>
              </div>
              <Button className={adminPrimaryButtonClass} onClick={openNewVocabulary} disabled={!isLoaded}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm từ
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-[#f0c4c0] bg-[#fffaf9]">
                <div className="grid min-w-[900px] grid-cols-[1.1fr_1.1fr_1.2fr_0.8fr_0.9fr_96px] gap-3 border-b border-[#f0c4c0] bg-[#fff0ef] px-4 py-3 text-sm font-medium text-[#7a3f45]">
                  <span>Tiếng Nhật</span>
                  <span>Hiragana</span>
                  <span>Tiếng Việt</span>
                  <span>Loại</span>
                  <span>Chủ đề</span>
                  <span />
                </div>
                {content.vocabulary.map((item) => (
                  <div
                    key={item.id}
                    className="grid min-w-[900px] grid-cols-[1.1fr_1.1fr_1.2fr_0.8fr_0.9fr_96px] items-center gap-3 border-b border-[#f5d6d3] px-4 py-3 text-sm text-[#6f5655] transition hover:bg-[#fff4f2] last:border-b-0"
                  >
                    <span className="font-semibold text-[#2b211c]">{item.japanese}</span>
                    <span>{item.hiragana}</span>
                    <span>{item.vietnamese}</span>
                    <Badge className="w-fit rounded-full border border-[#f0c4c0] bg-[#fff0ef] text-[#c94955] shadow-none">{item.type}</Badge>
                    <span>{item.topic}</span>
                    <RowActions
                      onEdit={() => openEditVocabulary(item)}
                      onDelete={() => void removeVocabulary(item.id)}
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grammar" className="mt-6">
          <Card className={adminPanelClass}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[#7a3f45]">Danh sách ngữ pháp</CardTitle>
                <CardDescription className="text-[#9a7472]">Quản lý mẫu câu, cách dùng và ví dụ N5.</CardDescription>
              </div>
              <Button className={adminPrimaryButtonClass} onClick={openNewGrammar} disabled={!isLoaded}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm mẫu
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-[#f0c4c0] bg-[#fffaf9]">
                <div className="grid min-w-[760px] grid-cols-[1.1fr_1fr_0.8fr_0.9fr_96px] gap-3 border-b border-[#f0c4c0] bg-[#fff0ef] px-4 py-3 text-sm font-medium text-[#7a3f45]">
                  <span>Mẫu câu</span>
                  <span>Ý nghĩa</span>
                  <span>Độ khó</span>
                  <span>Trạng thái</span>
                  <span />
                </div>
                {content.grammar.map((item) => (
                  <div
                    key={item.id}
                    className="grid min-w-[760px] grid-cols-[1.1fr_1fr_0.8fr_0.9fr_96px] items-center gap-3 border-b border-[#f5d6d3] px-4 py-3 text-sm text-[#6f5655] transition hover:bg-[#fff4f2] last:border-b-0"
                  >
                    <span className="font-semibold text-[#2b211c]">{item.pattern}</span>
                    <span>{item.meaning}</span>
                    <Badge className="w-fit rounded-full border border-[#ead0df] bg-[#fff3f8] text-[#a7557c] shadow-none">{item.difficulty}</Badge>
                    <span>{item.status}</span>
                    <RowActions
                      onEdit={() => openEditGrammar(item)}
                      onDelete={() => void removeGrammar(item.id)}
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <Card className={adminPanelClass}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[#7a3f45]">Danh sách câu hỏi quiz</CardTitle>
                <CardDescription className="text-[#9a7472]">Tạo câu hỏi luyện tập từ vựng và ngữ pháp.</CardDescription>
              </div>
              <Button className={adminPrimaryButtonClass} onClick={openNewQuiz} disabled={!isLoaded}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm câu hỏi
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-[#f0c4c0] bg-[#fffaf9]">
                <div className="grid min-w-[820px] grid-cols-[1.8fr_0.8fr_0.8fr_1fr_96px] gap-3 border-b border-[#f0c4c0] bg-[#fff0ef] px-4 py-3 text-sm font-medium text-[#7a3f45]">
                  <span>Câu hỏi</span>
                  <span>Loại</span>
                  <span>Độ khó</span>
                  <span>Chủ đề</span>
                  <span />
                </div>
                {content.quiz.map((item) => (
                  <div
                    key={item.id}
                    className="grid min-w-[820px] grid-cols-[1.8fr_0.8fr_0.8fr_1fr_96px] items-center gap-3 border-b border-[#f5d6d3] px-4 py-3 text-sm text-[#6f5655] transition hover:bg-[#fff4f2] last:border-b-0"
                  >
                    <span className="line-clamp-2 font-semibold text-[#2b211c]">{item.question}</span>
                    <Badge className="w-fit rounded-full border border-[#f3d2bf] bg-[#fff4ed] text-[#c7633f] shadow-none">{item.type === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}</Badge>
                    <span>{item.difficulty}</span>
                    <span>{item.topic}</span>
                    <RowActions
                      onEdit={() => openEditQuiz(item)}
                      onDelete={() => void removeQuiz(item.id)}
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={vocabularyDialogOpen} onOpenChange={setVocabularyDialogOpen}>
        <DialogContent className="border-[#f0c4c0] bg-[#fffaf9] sm:max-w-2xl">
          <form onSubmit={saveVocabulary} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-[#7a3f45]">{editorMode === "create" ? "Thêm từ vựng" : "Sửa từ vựng"}</DialogTitle>
              <DialogDescription className="text-[#9a7472]">Nhập đầy đủ kana, romaji, nghĩa và ví dụ để dùng trong học/quiz.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tiếng Nhật" value={vocabularyForm.japanese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, japanese: value })} />
              <Field label="Hiragana" value={vocabularyForm.hiragana} onChange={(value) => setVocabularyForm({ ...vocabularyForm, hiragana: value })} />
              <Field label="Romaji" value={vocabularyForm.romaji} onChange={(value) => setVocabularyForm({ ...vocabularyForm, romaji: value })} />
              <Field label="Tiếng Việt" value={vocabularyForm.vietnamese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, vietnamese: value })} />
              <Field label="Loại từ" value={vocabularyForm.type} onChange={(value) => setVocabularyForm({ ...vocabularyForm, type: value })} />
              <Field label="Chủ đề" value={vocabularyForm.topic} onChange={(value) => setVocabularyForm({ ...vocabularyForm, topic: value })} />
              <Field label="URL ảnh minh họa" value={vocabularyForm.imageUrl ?? ""} onChange={(value) => setVocabularyForm({ ...vocabularyForm, imageUrl: value.trim() || null })} />
            </div>
            <Field label="Ví dụ tiếng Nhật" value={vocabularyForm.example.japanese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, example: { ...vocabularyForm.example, japanese: value } })} />
            <Field label="Dịch ví dụ" value={vocabularyForm.example.vietnamese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, example: { ...vocabularyForm.example, vietnamese: value } })} />
            <DialogFooter>
              <Button type="button" variant="outline" className={adminButtonClass} onClick={() => setVocabularyDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className={adminPrimaryButtonClass} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={grammarDialogOpen} onOpenChange={setGrammarDialogOpen}>
        <DialogContent className="border-[#f0c4c0] bg-[#fffaf9] sm:max-w-2xl">
          <form onSubmit={saveGrammar} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-[#7a3f45]">{editorMode === "create" ? "Thêm ngữ pháp" : "Sửa ngữ pháp"}</DialogTitle>
              <DialogDescription className="text-[#9a7472]">Mỗi mẫu nên có cấu trúc, cách dùng và một ví dụ ngắn.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mẫu câu" value={grammarForm.pattern} onChange={(value) => setGrammarForm({ ...grammarForm, pattern: value })} />
              <Field label="Ý nghĩa" value={grammarForm.meaning} onChange={(value) => setGrammarForm({ ...grammarForm, meaning: value })} />
              <Field label="Cấu trúc" value={grammarForm.structure} onChange={(value) => setGrammarForm({ ...grammarForm, structure: value })} />
              <Field label="Độ khó" value={grammarForm.difficulty} onChange={(value) => setGrammarForm({ ...grammarForm, difficulty: value as GrammarItem["difficulty"] })} />
            </div>
            <Field label="Ví dụ tiếng Nhật" value={grammarForm.example.japanese} onChange={(value) => setGrammarForm({ ...grammarForm, example: { ...grammarForm.example, japanese: value } })} />
            <Field label="Dịch ví dụ" value={grammarForm.example.vietnamese} onChange={(value) => setGrammarForm({ ...grammarForm, example: { ...grammarForm.example, vietnamese: value } })} />
            <div className="space-y-2">
              <Label className="text-[#7a3f45]">Ghi chú sử dụng</Label>
              <Textarea className="border-[#f0c4c0] bg-white/80 focus-visible:ring-[#e96f78]/30" value={grammarForm.usageNote} onChange={(event) => setGrammarForm({ ...grammarForm, usageNote: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className={adminButtonClass} onClick={() => setGrammarDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className={adminPrimaryButtonClass} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="border-[#f0c4c0] bg-[#fffaf9] sm:max-w-2xl">
          <form onSubmit={saveQuiz} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-[#7a3f45]">{editorMode === "create" ? "Thêm câu hỏi quiz" : "Sửa câu hỏi quiz"}</DialogTitle>
              <DialogDescription className="text-[#9a7472]">Câu hỏi có 4 đáp án A-D và một đáp án đúng.</DialogDescription>
            </DialogHeader>
            <Field label="Câu hỏi" value={quizForm.question} onChange={(value) => setQuizForm({ ...quizForm, question: value })} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Loại" value={quizForm.type} onChange={(value) => setQuizForm({ ...quizForm, type: value as QuizQuestionItem["type"] })} />
              <Field label="Độ khó" value={quizForm.difficulty} onChange={(value) => setQuizForm({ ...quizForm, difficulty: value as QuizQuestionItem["difficulty"] })} />
              <Field label="Chủ đề" value={quizForm.topic} onChange={(value) => setQuizForm({ ...quizForm, topic: value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {quizForm.answers.map((answer, index) => (
                <Field
                  key={answer.id}
                  label={`Đáp án ${answer.id.toUpperCase()}`}
                  value={answer.text}
                  onChange={(value) => {
                    const nextAnswers = quizForm.answers.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, text: value } : entry
                    )
                    setQuizForm({ ...quizForm, answers: nextAnswers })
                  }}
                />
              ))}
            </div>
            <Field label="Đáp án đúng (a/b/c/d)" value={quizForm.correctAnswer} onChange={(value) => setQuizForm({ ...quizForm, correctAnswer: value })} />
            <div className="space-y-2">
              <Label className="text-[#7a3f45]">Giải thích</Label>
              <Textarea className="border-[#f0c4c0] bg-white/80 focus-visible:ring-[#e96f78]/30" value={quizForm.explanation} onChange={(event) => setQuizForm({ ...quizForm, explanation: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className={adminButtonClass} onClick={() => setQuizDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className={adminPrimaryButtonClass} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#7a3f45]">{label}</Label>
      <Input
        className="border-[#f0c4c0] bg-white/80 text-[#6f5655] focus-visible:ring-[#e96f78]/30"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: number
  subtitle: string
  icon: ReactNode
}) {
  return (
    <Card className={adminPanelClass}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-[#8a6665]">{title}</p>
          <div className="mt-1 text-3xl font-bold text-[#7a3f45]">{value}</div>
          <p className="mt-1 text-xs text-[#9a7472]">{subtitle}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe7e4] text-[#d94f5b]">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function RowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-[#c94955] hover:bg-[#ffe7e4] hover:text-[#c94955]"
        onClick={onEdit}
        disabled={disabled}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-[#d45a4c] hover:bg-[#fff0ef] hover:text-[#b94438]"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}


