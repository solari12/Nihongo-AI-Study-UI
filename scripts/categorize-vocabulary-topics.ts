import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

config({ path: ".env.local" })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

type VocabularyRow = {
  id: number
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
}

type CategoryRule = {
  topic: string
  keywords: string[]
  japanese?: string[]
}

const rules: CategoryRule[] = [
  {
    topic: "Chào hỏi",
    keywords: ["hello", "goodbye", "thank", "sorry", "please", "welcome", "morning", "evening", "greeting"],
    japanese: ["こんにちは", "こんばんは", "おはよう", "ありがとう", "すみません", "さようなら"],
  },
  {
    topic: "Gia đình",
    keywords: ["father", "mother", "parent", "older brother", "younger brother", "older sister", "younger sister", "family", "wife", "husband", "child", "children", "grandfather", "grandmother"],
    japanese: ["父", "母", "兄", "姉", "弟", "妹", "家族", "子供", "奥さん", "夫"],
  },
  {
    topic: "Trường học",
    keywords: ["school", "student", "teacher", "class", "study", "university", "lesson", "homework", "test", "exam", "book", "notebook"],
    japanese: ["学校", "学生", "先生", "大学", "勉強", "授業", "本"],
  },
  {
    topic: "Thời gian",
    keywords: ["time", "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night", "week", "month", "year", "hour", "minute", "day", "now", "later", "calendar"],
    japanese: ["今日", "明日", "昨日", "朝", "昼", "夜", "今", "年", "月", "日", "時", "分", "週間"],
  },
  {
    topic: "Số đếm",
    keywords: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand", "number", "counter"],
    japanese: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万"],
  },
  {
    topic: "Đồ ăn",
    keywords: ["eat", "drink", "food", "meal", "rice", "water", "tea", "coffee", "meat", "fish", "vegetable", "fruit", "breakfast", "lunch", "dinner", "restaurant"],
    japanese: ["食べる", "飲む", "水", "茶", "肉", "魚", "野菜", "果物", "ご飯", "朝ご飯", "昼ご飯", "晩ご飯"],
  },
  {
    topic: "Địa điểm",
    keywords: ["place", "where", "home", "house", "room", "station", "shop", "store", "company", "hospital", "bank", "post office", "country", "japan", "city", "park", "library"],
    japanese: ["家", "部屋", "駅", "店", "会社", "病院", "銀行", "郵便局", "国", "日本", "町", "公園", "図書館"],
  },
  {
    topic: "Di chuyển",
    keywords: ["go", "come", "return", "walk", "run", "ride", "enter", "exit", "leave", "arrive", "car", "train", "bus", "taxi", "bicycle", "airplane"],
    japanese: ["行く", "来る", "帰る", "歩く", "走る", "入る", "出る", "車", "電車", "バス", "自転車", "飛行機"],
  },
  {
    topic: "Đồ vật",
    keywords: ["thing", "object", "book", "pen", "pencil", "paper", "desk", "chair", "phone", "clock", "bag", "umbrella", "key", "money", "newspaper", "camera", "picture", "map"],
    japanese: ["物", "本", "鉛筆", "紙", "机", "椅子", "電話", "時計", "鞄", "傘", "鍵", "お金", "新聞", "写真", "地図"],
  },
  {
    topic: "Người & nghề nghiệp",
    keywords: ["person", "people", "man", "woman", "friend", "doctor", "employee", "worker", "clerk", "engineer", "name", "someone"],
    japanese: ["人", "男", "女", "友達", "医者", "会社員", "名前"],
  },
  {
    topic: "Cơ thể & sức khỏe",
    keywords: ["body", "head", "eye", "ear", "mouth", "hand", "foot", "sick", "illness", "medicine", "health", "pain"],
    japanese: ["頭", "目", "耳", "口", "手", "足", "病気", "薬"],
  },
  {
    topic: "Màu sắc",
    keywords: ["red", "blue", "white", "black", "yellow", "green", "color", "colour"],
    japanese: ["赤", "青", "白", "黒", "黄色", "緑"],
  },
  {
    topic: "Thiên nhiên",
    keywords: ["weather", "rain", "snow", "wind", "sky", "river", "mountain", "sea", "flower", "tree", "sun", "moon"],
    japanese: ["天気", "雨", "雪", "風", "空", "川", "山", "海", "花", "木", "日", "月"],
  },
]

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function categorize(item: VocabularyRow) {
  const text = `${item.japanese} ${item.hiragana} ${item.romaji} ${item.vietnamese} ${item.type}`.toLowerCase()

  for (const rule of rules) {
    if (rule.japanese?.some((value) => item.japanese.includes(value))) return rule.topic
    if (includesAny(text, rule.keywords)) return rule.topic
  }

  if (item.type.includes("Động") || item.type.toLowerCase().includes("verb")) return "Động từ"
  if (item.type.includes("Tính") || item.type.toLowerCase().includes("adjective")) return "Tính từ"
  if (item.type.includes("Trợ") || item.type.toLowerCase().includes("particle")) return "Trợ từ"
  if (item.type.includes("Trạng") || item.type.toLowerCase().includes("adverb")) return "Trạng từ"

  return "Khác"
}

async function main() {
  const vocabulary = await prisma.vocabulary.findMany({
    select: {
      id: true,
      japanese: true,
      hiragana: true,
      romaji: true,
      vietnamese: true,
      type: true,
    },
    orderBy: {
      id: "asc",
    },
  })

  const counts = new Map<string, number>()

  for (const item of vocabulary) {
    const topic = categorize(item)
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
    await prisma.vocabulary.update({
      where: { id: item.id },
      data: { topic },
    })
  }

  console.log(`Categorized ${vocabulary.length} vocabulary items`)
  for (const [topic, count] of Array.from(counts.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`${topic}: ${count}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
