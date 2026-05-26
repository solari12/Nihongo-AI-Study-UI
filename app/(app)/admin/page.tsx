"use client"

import { ChangeEvent, FormEvent, useRef, useState } from "react"
import { StatsCard } from "@/components/app/stats-card"
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
import {
  BookOpen,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react"
import { isAdminContent, useAdminContent } from "@/hooks/use-admin-content"
import type { GrammarItem, QuizQuestionItem, VocabularyItem } from "@/lib/data/nihongo-study"

const emptyVocabulary: Omit<VocabularyItem, "id"> = {
  japanese: "",
  hiragana: "",
  romaji: "",
  vietnamese: "",
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

export default function AdminPage() {
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

  const saveVocabulary = (event: FormEvent) => {
    event.preventDefault()
    if ("id" in vocabularyForm) {
      updateVocabulary(vocabularyForm)
    } else {
      addVocabulary(vocabularyForm)
    }
    setVocabularyDialogOpen(false)
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

  const saveGrammar = (event: FormEvent) => {
    event.preventDefault()
    if ("id" in grammarForm) {
      updateGrammar(grammarForm)
    } else {
      addGrammar(grammarForm)
    }
    setGrammarDialogOpen(false)
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

  const saveQuiz = (event: FormEvent) => {
    event.preventDefault()
    if ("id" in quizForm) {
      updateQuizQuestion(quizForm)
    } else {
      addQuizQuestion(quizForm)
    }
    setQuizDialogOpen(false)
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Quản trị nội dung N5
          </h1>
          <p className="text-muted-foreground">
            Thêm và chỉnh sửa dữ liệu học tập. Dữ liệu được lưu trên trình duyệt của bạn.
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
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Nhập JSON
          </Button>
          <Button variant="outline" onClick={exportContent}>
            Xuất JSON
          </Button>
          <Button variant="outline" onClick={resetContent}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Khôi phục dữ liệu mẫu
          </Button>
        </div>
      </div>

      {importMessage && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            {importMessage}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Từ vựng"
          value={content.vocabulary.length}
          subtitle="mục đang quản lý"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatsCard
          title="Ngữ pháp"
          value={content.grammar.length}
          subtitle="mẫu câu"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Quiz"
          value={content.quiz.length}
          subtitle="câu hỏi"
          icon={<HelpCircle className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="vocabulary">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vocabulary">Từ vựng</TabsTrigger>
          <TabsTrigger value="grammar">Ngữ pháp</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Danh sách từ vựng</CardTitle>
                <CardDescription>Nhập dần bộ từ vựng N5 theo chủ đề.</CardDescription>
              </div>
              <Button onClick={openNewVocabulary}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm từ
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1.1fr_1.1fr_1.2fr_0.8fr_0.9fr_96px] gap-3 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
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
                    className="grid grid-cols-[1.1fr_1.1fr_1.2fr_0.8fr_0.9fr_96px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-medium">{item.japanese}</span>
                    <span>{item.hiragana}</span>
                    <span>{item.vietnamese}</span>
                    <Badge variant="outline">{item.type}</Badge>
                    <span>{item.topic}</span>
                    <RowActions
                      onEdit={() => openEditVocabulary(item)}
                      onDelete={() => deleteVocabulary(item.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grammar" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Danh sách ngữ pháp</CardTitle>
                <CardDescription>Quản lý mẫu câu, cách dùng và ví dụ N5.</CardDescription>
              </div>
              <Button onClick={openNewGrammar}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm mẫu
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.9fr_96px] gap-3 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
                  <span>Mẫu câu</span>
                  <span>Ý nghĩa</span>
                  <span>Độ khó</span>
                  <span>Trạng thái</span>
                  <span />
                </div>
                {content.grammar.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.1fr_1fr_0.8fr_0.9fr_96px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-medium">{item.pattern}</span>
                    <span>{item.meaning}</span>
                    <Badge variant="outline">{item.difficulty}</Badge>
                    <span>{item.status}</span>
                    <RowActions
                      onEdit={() => openEditGrammar(item)}
                      onDelete={() => deleteGrammar(item.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Danh sách câu hỏi quiz</CardTitle>
                <CardDescription>Tạo câu hỏi luyện tập từ vựng và ngữ pháp.</CardDescription>
              </div>
              <Button onClick={openNewQuiz}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm câu hỏi
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr_96px] gap-3 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
                  <span>Câu hỏi</span>
                  <span>Loại</span>
                  <span>Độ khó</span>
                  <span>Chủ đề</span>
                  <span />
                </div>
                {content.quiz.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr_96px] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-medium">{item.question}</span>
                    <Badge variant="outline">{item.type === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}</Badge>
                    <span>{item.difficulty}</span>
                    <span>{item.topic}</span>
                    <RowActions
                      onEdit={() => openEditQuiz(item)}
                      onDelete={() => deleteQuizQuestion(item.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={vocabularyDialogOpen} onOpenChange={setVocabularyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveVocabulary} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editorMode === "create" ? "Thêm từ vựng" : "Sửa từ vựng"}</DialogTitle>
              <DialogDescription>Nhập đầy đủ kana, romaji, nghĩa và ví dụ để dùng trong học/quiz.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tiếng Nhật" value={vocabularyForm.japanese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, japanese: value })} />
              <Field label="Hiragana" value={vocabularyForm.hiragana} onChange={(value) => setVocabularyForm({ ...vocabularyForm, hiragana: value })} />
              <Field label="Romaji" value={vocabularyForm.romaji} onChange={(value) => setVocabularyForm({ ...vocabularyForm, romaji: value })} />
              <Field label="Tiếng Việt" value={vocabularyForm.vietnamese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, vietnamese: value })} />
              <Field label="Loại từ" value={vocabularyForm.type} onChange={(value) => setVocabularyForm({ ...vocabularyForm, type: value })} />
              <Field label="Chủ đề" value={vocabularyForm.topic} onChange={(value) => setVocabularyForm({ ...vocabularyForm, topic: value })} />
            </div>
            <Field label="Ví dụ tiếng Nhật" value={vocabularyForm.example.japanese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, example: { ...vocabularyForm.example, japanese: value } })} />
            <Field label="Dịch ví dụ" value={vocabularyForm.example.vietnamese} onChange={(value) => setVocabularyForm({ ...vocabularyForm, example: { ...vocabularyForm.example, vietnamese: value } })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVocabularyDialogOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={grammarDialogOpen} onOpenChange={setGrammarDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveGrammar} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editorMode === "create" ? "Thêm ngữ pháp" : "Sửa ngữ pháp"}</DialogTitle>
              <DialogDescription>Mỗi mẫu nên có cấu trúc, cách dùng và một ví dụ ngắn.</DialogDescription>
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
              <Label>Ghi chú sử dụng</Label>
              <Textarea value={grammarForm.usageNote} onChange={(event) => setGrammarForm({ ...grammarForm, usageNote: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGrammarDialogOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveQuiz} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editorMode === "create" ? "Thêm câu hỏi quiz" : "Sửa câu hỏi quiz"}</DialogTitle>
              <DialogDescription>Câu hỏi có 4 đáp án A-D và một đáp án đúng.</DialogDescription>
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
              <Label>Giải thích</Label>
              <Textarea value={quizForm.explanation} onChange={(event) => setQuizForm({ ...quizForm, explanation: event.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuizDialogOpen(false)}>Hủy</Button>
              <Button type="submit">Lưu</Button>
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
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
