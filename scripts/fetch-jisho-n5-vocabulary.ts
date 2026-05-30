import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

type JishoJapaneseEntry = {
  word?: string
  reading?: string
}

type JishoSense = {
  english_definitions?: string[]
  parts_of_speech?: string[]
}

type JishoWord = {
  slug: string
  is_common?: boolean
  jlpt?: string[]
  tags?: string[]
  japanese?: JishoJapaneseEntry[]
  senses?: JishoSense[]
}

type JishoResponse = {
  data?: JishoWord[]
}

type ImportedVocabulary = {
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  topic: string
  source: {
    provider: "jisho"
    slug: string
    url: string
    englishDefinitions: string[]
    partsOfSpeech: string[]
    isCommon: boolean
  }
  example: {
    japanese: string
    vietnamese: string
  }
}

const maxPages = Number(process.env.JISHO_MAX_PAGES ?? 10)
const outputPath = path.join(process.cwd(), "data", "imports", "jisho-n5-vocabulary.json")

const kanaMap: Record<string, string> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
}

function katakanaToHiragana(value: string) {
  return value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
}

function kanaToRomaji(value: string) {
  const kana = katakanaToHiragana(value)
  let result = ""

  for (let index = 0; index < kana.length; index += 1) {
    const current = kana[index]
    const next = kana[index + 1]
    const pair = `${current}${next ?? ""}`

    if (current === "っ" && next) {
      const nextRomaji = kanaMap[next] ?? kanaMap[pair] ?? ""
      result += nextRomaji[0] ?? ""
      continue
    }

    if (current === "ー") {
      result += result.at(-1) ?? ""
      continue
    }

    if (kanaMap[pair]) {
      result += kanaMap[pair]
      index += 1
      continue
    }

    result += kanaMap[current] ?? current
  }

  return result
}

function mapPartOfSpeech(partsOfSpeech: string[]) {
  const text = partsOfSpeech.join(" ").toLowerCase()

  if (text.includes("verb")) return "Động từ"
  if (text.includes("adjective")) return "Tính từ"
  if (text.includes("adverb")) return "Trạng từ"
  if (text.includes("particle")) return "Trợ từ"
  if (text.includes("expression")) return "Cụm từ"
  if (text.includes("counter")) return "Lượng từ"

  return "Danh từ"
}

function normalizeWord(word: JishoWord): ImportedVocabulary | null {
  const primaryJapanese = word.japanese?.[0]
  const japanese = primaryJapanese?.word ?? primaryJapanese?.reading
  const hiragana = primaryJapanese?.reading ? katakanaToHiragana(primaryJapanese.reading) : ""
  const englishDefinitions = word.senses?.flatMap((sense) => sense.english_definitions ?? []) ?? []
  const partsOfSpeech = word.senses?.flatMap((sense) => sense.parts_of_speech ?? []) ?? []

  if (!japanese || !hiragana || englishDefinitions.length === 0) return null

  return {
    japanese,
    hiragana,
    romaji: kanaToRomaji(hiragana),
    vietnamese: `[Cần dịch] ${englishDefinitions.slice(0, 3).join("; ")}`,
    type: mapPartOfSpeech(partsOfSpeech),
    topic: "JLPT N5",
    source: {
      provider: "jisho",
      slug: word.slug,
      url: `https://jisho.org/search/${encodeURIComponent(word.slug)}`,
      englishDefinitions,
      partsOfSpeech,
      isCommon: Boolean(word.is_common),
    },
    example: {
      japanese: "例文を追加してください。",
      vietnamese: "Cần bổ sung ví dụ.",
    },
  }
}

async function fetchPage(page: number) {
  const params = new URLSearchParams({
    keyword: "#jlpt-n5",
    page: String(page),
  })
  const response = await fetch(`https://jisho.org/api/v1/search/words?${params}`)

  if (!response.ok) {
    throw new Error(`Jisho API failed on page ${page}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as JishoResponse
}

async function main() {
  const bySlug = new Map<string, ImportedVocabulary>()
  let stagnantPages = 0

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchPage(page)
    const words = response.data ?? []
    const before = bySlug.size

    for (const word of words) {
      if (!word.jlpt?.some((tag) => tag.toLowerCase() === "jlpt-n5")) continue
      const normalized = normalizeWord(word)
      if (normalized) bySlug.set(word.slug, normalized)
    }

    const added = bySlug.size - before
    console.log(`Fetched page ${page}: ${words.length} records, ${added} new N5 items`)

    if (words.length === 0 || added === 0) stagnantPages += 1
    else stagnantPages = 0

    if (stagnantPages >= 2) break
  }

  const vocabulary = Array.from(bySlug.values()).sort((a, b) => a.romaji.localeCompare(b.romaji))
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({ vocabulary }, null, 2)}\n`, "utf8")

  console.log(`Saved ${vocabulary.length} vocabulary items to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
