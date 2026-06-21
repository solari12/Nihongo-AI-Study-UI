import { readFile } from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"
import { vietnameseVocabularyTerms } from "../lib/vietnamese-vocabulary-dictionary"
import { naturalVocabularyExamples } from "../lib/vocabulary-examples"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not configured")

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

type SourceVocabulary = {
  japanese: string
  hiragana: string
  source?: {
    partsOfSpeech?: string[]
  }
}

type ImportFile = {
  vocabulary: SourceVocabulary[]
}

const topicRules: Array<{ key: string; label: string; words: string[] }> = [
  { key: "greetings", label: "Chào hỏi", words: ["朝", "夜"] },
  { key: "family", label: "Gia đình", words: ["父", "姉", "家族", "家庭", "子供", "結婚"] },
  { key: "school", label: "Trường học", words: ["学生", "先生", "学校", "大学", "授業", "教室", "勉強", "宿題", "問題", "漢字", "英語", "本棚"] },
  { key: "time", label: "Thời gian", words: ["時間", "今日", "昨日", "明日", "今", "年", "誕生日", "夏休み", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日", "春", "夏", "冬", "昼"] },
  { key: "numbers", label: "Số đếm", words: ["百", "一番"] },
  { key: "food", label: "Đồ ăn", words: ["水", "食べる", "飲む", "豚肉", "牛肉", "肉", "野菜", "卵", "砂糖", "塩", "飴", "茶碗", "紅茶", "料理", "食堂"] },
  { key: "places", label: "Địa điểm", words: ["日本", "病院", "大学", "学校", "台所", "駅", "銀行", "会社", "公園", "町", "村", "図書館", "郵便局", "大使館", "交番", "喫茶店", "映画館", "部屋"] },
  { key: "transport", label: "Di chuyển", words: ["地下鉄", "電車", "自動車", "自転車", "飛行機", "車", "走る", "出る", "旅行", "散歩", "道", "交差点", "切符"] },
  { key: "objects", label: "Đồ vật", words: ["電話", "本", "地図", "鉛筆", "机", "椅子", "鞄", "花瓶", "鍵", "紙", "傘", "時計", "手紙", "新聞", "写真", "雑誌", "財布", "帽子", "靴", "靴下", "メガネ", "冷蔵庫", "石鹸", "万年筆", "切手", "封筒", "箱", "灰皿", "戸", "窓"] },
  { key: "people_jobs", label: "Người & nghề nghiệp", words: ["外国人", "男", "大人", "皆", "名前", "仕事", "声", "誰", "私", "自分"] },
  { key: "health", label: "Cơ thể & sức khỏe", words: ["足", "頭", "病気", "風邪", "歯", "鼻", "口", "目", "耳", "手", "メガネ", "石鹸"] },
  { key: "colors", label: "Màu sắc", words: ["赤", "青", "茶色", "黄色", "黒", "白", "緑", "色"] },
  { key: "nature", label: "Thiên nhiên", words: ["雨", "雪", "曇り", "海", "山", "川", "池", "花", "木", "春", "夏", "冬"] },
]

function inferPartOfSpeech(parts: string[], fallbackType: string) {
  const text = `${parts.join(" ")} ${fallbackType}`.toLowerCase()
  if (text.includes("particle") || fallbackType.includes("Trợ")) return "particle"
  if (text.includes("counter") || fallbackType.includes("Lượng")) return "counter"
  if (text.includes("adverb") || fallbackType.includes("Trạng") || fallbackType.includes("Phó")) return "adverb"
  if (text.includes("i-adjective")) return "i_adjective"
  if (text.includes("na-adjective")) return "na_adjective"
  if (text.includes("adjective") || fallbackType.includes("Tính")) return "i_adjective"
  if (text.includes("verb") || fallbackType.includes("Động")) return "verb"
  if (text.includes("noun") || fallbackType.includes("Danh")) return "noun"
  return "expression"
}

function typeLabel(partOfSpeech: string) {
  return {
    noun: "Danh từ",
    verb: "Động từ",
    i_adjective: "Tính từ い",
    na_adjective: "Tính từ な",
    adverb: "Trạng từ",
    particle: "Trợ từ",
    counter: "Lượng từ",
    expression: "Cụm từ",
  }[partOfSpeech] ?? "Cụm từ"
}

function topicFor(japanese: string, partOfSpeech: string) {
  const rule = topicRules.find((item) => item.words.includes(japanese))
  if (rule) return rule
  if (partOfSpeech === "verb") return { key: "verbs", label: "Động từ" }
  if (partOfSpeech === "i_adjective" || partOfSpeech === "na_adjective") {
    return { key: "adjectives", label: "Tính từ" }
  }
  return { key: "other", label: "Khác" }
}

function fallbackExample(japanese: string, meaning: string, partOfSpeech: string) {
  if (partOfSpeech === "verb") {
    return {
      japanese: `毎日「${japanese}」を使って文を作ります。`,
      vietnamese: `Mỗi ngày tôi đặt câu sử dụng từ “${japanese}” (${meaning}).`,
    }
  }
  if (partOfSpeech === "i_adjective" || partOfSpeech === "na_adjective") {
    return {
      japanese: `これは「${japanese}」という意味です。`,
      vietnamese: `Điều này mang nghĩa “${meaning}”.`,
    }
  }
  if (partOfSpeech === "particle" || partOfSpeech === "counter") {
    return {
      japanese: `「${japanese}」の使い方を練習します。`,
      vietnamese: `Tôi luyện cách dùng “${japanese}” (${meaning}).`,
    }
  }
  return {
    japanese: `これは「${japanese}」です。`,
    vietnamese: `Đây là “${japanese}” (${meaning}).`,
  }
}

async function main() {
  const raw = await readFile(path.join(process.cwd(), "data", "imports", "jisho-n5-vocabulary.json"), "utf8")
  const source = JSON.parse(raw) as ImportFile
  const sourceByKey = new Map(source.vocabulary.map((item) => [`${item.japanese}:${item.hiragana}`, item]))
  const vocabulary = await prisma.vocabulary.findMany({ orderBy: { id: "asc" } })

  for (const item of vocabulary) {
    const metadata = sourceByKey.get(`${item.japanese}:${item.hiragana}`)
    const partOfSpeech = inferPartOfSpeech(metadata?.source?.partsOfSpeech ?? [], item.type)
    const topic = topicFor(item.japanese, partOfSpeech)
    const vietnamese = vietnameseVocabularyTerms[item.japanese] ?? item.vietnamese
    const example = naturalVocabularyExamples[item.japanese] ?? fallbackExample(item.japanese, vietnamese, partOfSpeech)

    await prisma.vocabulary.update({
      where: { id: item.id },
      data: {
        vietnamese,
        type: typeLabel(partOfSpeech),
        partOfSpeech,
        topic: topic.label,
        topicKey: topic.key,
        exampleJapanese: example.japanese,
        exampleVietnamese: example.vietnamese,
      },
    })
  }

  console.log(`Cleaned ${vocabulary.length} vocabulary items`)
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
