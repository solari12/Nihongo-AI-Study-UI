"use client"

import { useState } from "react"
import { Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type KanaCell = {
  kana: string
  romaji: string
}

const gojuonRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "Nguyên âm",
    hiragana: [
      { kana: "あ", romaji: "a" },
      { kana: "い", romaji: "i" },
      { kana: "う", romaji: "u" },
      { kana: "え", romaji: "e" },
      { kana: "お", romaji: "o" },
    ],
    katakana: [
      { kana: "ア", romaji: "a" },
      { kana: "イ", romaji: "i" },
      { kana: "ウ", romaji: "u" },
      { kana: "エ", romaji: "e" },
      { kana: "オ", romaji: "o" },
    ],
  },
  {
    label: "Hàng K",
    hiragana: [
      { kana: "か", romaji: "ka" },
      { kana: "き", romaji: "ki" },
      { kana: "く", romaji: "ku" },
      { kana: "け", romaji: "ke" },
      { kana: "こ", romaji: "ko" },
    ],
    katakana: [
      { kana: "カ", romaji: "ka" },
      { kana: "キ", romaji: "ki" },
      { kana: "ク", romaji: "ku" },
      { kana: "ケ", romaji: "ke" },
      { kana: "コ", romaji: "ko" },
    ],
  },
  {
    label: "Hàng S",
    hiragana: [
      { kana: "さ", romaji: "sa" },
      { kana: "し", romaji: "shi" },
      { kana: "す", romaji: "su" },
      { kana: "せ", romaji: "se" },
      { kana: "そ", romaji: "so" },
    ],
    katakana: [
      { kana: "サ", romaji: "sa" },
      { kana: "シ", romaji: "shi" },
      { kana: "ス", romaji: "su" },
      { kana: "セ", romaji: "se" },
      { kana: "ソ", romaji: "so" },
    ],
  },
  {
    label: "Hàng T",
    hiragana: [
      { kana: "た", romaji: "ta" },
      { kana: "ち", romaji: "chi" },
      { kana: "つ", romaji: "tsu" },
      { kana: "て", romaji: "te" },
      { kana: "と", romaji: "to" },
    ],
    katakana: [
      { kana: "タ", romaji: "ta" },
      { kana: "チ", romaji: "chi" },
      { kana: "ツ", romaji: "tsu" },
      { kana: "テ", romaji: "te" },
      { kana: "ト", romaji: "to" },
    ],
  },
  {
    label: "Hàng N",
    hiragana: [
      { kana: "な", romaji: "na" },
      { kana: "に", romaji: "ni" },
      { kana: "ぬ", romaji: "nu" },
      { kana: "ね", romaji: "ne" },
      { kana: "の", romaji: "no" },
    ],
    katakana: [
      { kana: "ナ", romaji: "na" },
      { kana: "ニ", romaji: "ni" },
      { kana: "ヌ", romaji: "nu" },
      { kana: "ネ", romaji: "ne" },
      { kana: "ノ", romaji: "no" },
    ],
  },
  {
    label: "Hàng H",
    hiragana: [
      { kana: "は", romaji: "ha" },
      { kana: "ひ", romaji: "hi" },
      { kana: "ふ", romaji: "fu" },
      { kana: "へ", romaji: "he" },
      { kana: "ほ", romaji: "ho" },
    ],
    katakana: [
      { kana: "ハ", romaji: "ha" },
      { kana: "ヒ", romaji: "hi" },
      { kana: "フ", romaji: "fu" },
      { kana: "ヘ", romaji: "he" },
      { kana: "ホ", romaji: "ho" },
    ],
  },
  {
    label: "Hàng M",
    hiragana: [
      { kana: "ま", romaji: "ma" },
      { kana: "み", romaji: "mi" },
      { kana: "む", romaji: "mu" },
      { kana: "め", romaji: "me" },
      { kana: "も", romaji: "mo" },
    ],
    katakana: [
      { kana: "マ", romaji: "ma" },
      { kana: "ミ", romaji: "mi" },
      { kana: "ム", romaji: "mu" },
      { kana: "メ", romaji: "me" },
      { kana: "モ", romaji: "mo" },
    ],
  },
  {
    label: "Hàng Y",
    hiragana: [
      { kana: "や", romaji: "ya" },
      { kana: "", romaji: "" },
      { kana: "ゆ", romaji: "yu" },
      { kana: "", romaji: "" },
      { kana: "よ", romaji: "yo" },
    ],
    katakana: [
      { kana: "ヤ", romaji: "ya" },
      { kana: "", romaji: "" },
      { kana: "ユ", romaji: "yu" },
      { kana: "", romaji: "" },
      { kana: "ヨ", romaji: "yo" },
    ],
  },
  {
    label: "Hàng R",
    hiragana: [
      { kana: "ら", romaji: "ra" },
      { kana: "り", romaji: "ri" },
      { kana: "る", romaji: "ru" },
      { kana: "れ", romaji: "re" },
      { kana: "ろ", romaji: "ro" },
    ],
    katakana: [
      { kana: "ラ", romaji: "ra" },
      { kana: "リ", romaji: "ri" },
      { kana: "ル", romaji: "ru" },
      { kana: "レ", romaji: "re" },
      { kana: "ロ", romaji: "ro" },
    ],
  },
  {
    label: "Hàng W",
    hiragana: [
      { kana: "わ", romaji: "wa" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "を", romaji: "wo" },
    ],
    katakana: [
      { kana: "ワ", romaji: "wa" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "ヲ", romaji: "wo" },
    ],
  },
  {
    label: "Âm N",
    hiragana: [
      { kana: "ん", romaji: "n" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
    ],
    katakana: [
      { kana: "ン", romaji: "n" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
      { kana: "", romaji: "" },
    ],
  },
]

const dakutenRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "G/Z/D/B/P",
    hiragana: "が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
    katakana: "ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ ダ ヂ ヅ デ ド バ ビ ブ ベ ボ パ ピ プ ペ ポ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
  },
]

const yoonRows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[] = [
  {
    label: "Âm ghép",
    hiragana: "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
    katakana: "キャ キュ キョ シャ シュ ショ チャ チュ チョ ニャ ニュ ニョ ヒャ ヒュ ヒョ ミャ ミュ ミョ リャ リュ リョ"
      .split(" ")
      .map((kana) => ({ kana, romaji: "" })),
  },
]

function speak(text: string) {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ja-JP"
  utterance.rate = 0.75
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("ja"))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

function KanaGrid({
  rows,
  script,
  compact = false,
}: {
  rows: { label: string; hiragana: KanaCell[]; katakana: KanaCell[] }[]
  script: "hiragana" | "katakana"
  compact?: boolean
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2 rounded-xl border border-[#dfb6aa] bg-[#fffdf8]/85 p-3 md:grid-cols-[130px_1fr]">
          <div className="flex items-center">
            <Badge variant="outline" className="border-[#d89a92] text-[#8f4742]">
              {row.label}
            </Badge>
          </div>
          <div className={cn("grid gap-2", compact ? "grid-cols-5 sm:grid-cols-7 md:grid-cols-10" : "grid-cols-5")}>
            {row[script].map((cell, index) =>
              cell.kana ? (
                <button
                  key={`${cell.kana}-${index}`}
                  type="button"
                  onClick={() => speak(cell.kana)}
                  className="min-h-20 rounded-lg border border-[#ead0c6] bg-white/75 p-2 text-center transition hover:-translate-y-0.5 hover:border-[#d86f75] hover:bg-[#fff8f1]"
                >
                  <span className="block text-3xl font-bold text-[#2a211f]">{cell.kana}</span>
                  {cell.romaji && <span className="mt-1 block text-xs font-medium text-[#6f5952]">{cell.romaji}</span>}
                </button>
              ) : (
                <div key={`empty-${index}`} className="min-h-20 rounded-lg border border-dashed border-[#ead0c6]/70 bg-white/25" />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanaSection({ script }: { script: "hiragana" | "katakana" }) {
  const title = script === "hiragana" ? "Hiragana" : "Katakana"
  const description =
    script === "hiragana"
      ? "Dùng cho từ thuần Nhật, trợ từ và phần đọc furigana."
      : "Dùng cho từ mượn, tên nước ngoài, thuật ngữ và nhấn mạnh."

  return (
    <div className="space-y-6">
      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl text-[#2a211f]">{title}</CardTitle>
              <p className="mt-2 text-sm text-[#6f5952]">{description}</p>
            </div>
            <Button variant="outline" className="rounded-full border-[#dfb6aa] bg-white/70" onClick={() => speak(script === "hiragana" ? "あいうえお" : "アイウエオ")}>
              <Volume2 className="mr-2 h-4 w-4" />
              Nghe mẫu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={gojuonRows} script={script} />
        </CardContent>
      </Card>

      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#2a211f]">Âm đục và bán âm đục</CardTitle>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={dakutenRows} script={script} compact />
        </CardContent>
      </Card>

      <Card className="border-[#dfb6aa] bg-[#fffdf8]/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#2a211f]">Âm ghép</CardTitle>
        </CardHeader>
        <CardContent>
          <KanaGrid rows={yoonRows} script={script} compact />
        </CardContent>
      </Card>
    </div>
  )
}

export default function KanaPage() {
  const [activeTab, setActiveTab] = useState("hiragana")

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_8%_12%,rgba(243,200,189,0.55),transparent_28%),linear-gradient(135deg,#fff8f1_0%,#fffdf8_50%,#f7d9d2_100%)] p-6">
      <div className="space-y-6">
        <section className="rounded-xl bg-[#fff8f1]/85 px-6 py-5">
          <Badge variant="outline" className="mb-3 border-[#d89a92] bg-[#f3c8bd]/45 text-[#8f4742]">
            Nền tảng chữ Nhật
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-[#2a211f]">Bảng Hiragana và Katakana</h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-[#4f403b]">
            Bấm vào từng ô để nghe phát âm. Học Hiragana trước, sau đó chuyển sang Katakana để đọc từ mượn.
          </p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full border border-[#dfb6aa] bg-[#f9ece6]/80 p-1">
            <TabsTrigger value="hiragana" className="rounded-full data-[state=active]:bg-[#702f2a] data-[state=active]:text-white">
              Hiragana
            </TabsTrigger>
            <TabsTrigger value="katakana" className="rounded-full data-[state=active]:bg-[#702f2a] data-[state=active]:text-white">
              Katakana
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hiragana">
            <KanaSection script="hiragana" />
          </TabsContent>
          <TabsContent value="katakana">
            <KanaSection script="katakana" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
