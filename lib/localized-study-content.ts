import type { Locale } from "@/lib/i18n"
import { vietnameseVocabularyTerms } from "@/lib/vietnamese-vocabulary-dictionary"

type LocalizedText = {
  primary: string
  secondary: string[]
}

const vietnameseGrammarTerms: Record<string, string> = {
  "N la N": "N là N",
  "Khong phai la N": "Không phải là N",
  "Da tung la N": "Đã từng là N",
  "Da khong phai la N": "Đã không phải là N",
  "Cai nay / cai do / cai kia": "Cái này / cái đó / cái kia",
  "N nay / N do / N kia": "N này / N đó / N kia",
  "Cho nay / cho do / cho kia": "Chỗ này / chỗ đó / chỗ kia",
  "Ai / cai gi / o dau": "Ai / cái gì / ở đâu",
  "Tro tu cau hoi": "Trợ từ câu hỏi",
  "Cung, cung vay": "Cũng, cũng vậy",
  "Cua, thuoc ve": "Của, thuộc về",
  "Va, cung voi": "Và, cùng với",
  "Va nhung khong liet ke het": "Và nhưng không liệt kê hết",
  "A va B": "A và B",
  "Danh dau tan ngu truc tiep": "Đánh dấu tân ngữ trực tiếp",
  "Thoi diem, diem den, doi tuong": "Thời điểm, điểm đến, đối tượng",
  "Tai noi xay ra hanh dong, bang phuong tien": "Tại nơi xảy ra hành động, bằng phương tiện",
  "Huong den": "Hướng đến",
  "Tu / den": "Từ / đến",
  "Co, ton tai (do vat/su viec)": "Có, tồn tại (đồ vật/sự việc)",
  "Co, ton tai (nguoi/dong vat)": "Có, tồn tại (người/động vật)",
  "Thich": "Thích",
  "Ghet, khong thich": "Ghét, không thích",
  "Gioi / kem": "Giỏi / kém",
  "Tinh tu i o hien tai": "Tính từ i ở hiện tại",
  "Khong ...": "Không ...",
  "Da ...": "Đã ...",
  "Tinh tu na o hien tai": "Tính từ na ở hiện tại",
  "Lam gi do (lich su)": "Làm gì đó (lịch sự)",
  "Khong lam gi do": "Không làm gì đó",
  "Da lam gi do": "Đã làm gì đó",
  "Da khong lam gi do": "Đã không làm gì đó",
  "Hay cung lam": "Hãy cùng làm",
  "Ban co muon ... khong?": "Bạn có muốn ... không?",
  "Muon lam gi do": "Muốn làm gì đó",
  "Hay lam on...": "Hãy làm ơn...",
  "Duoc phep lam...": "Được phép làm...",
  "Khong duoc lam...": "Không được làm...",
  "Dang lam, dang trong trang thai": "Đang làm, đang trong trạng thái",
  "Da tung lam gi": "Đã từng làm gì",
  "Lam nhung viec nhu...": "Làm những việc như...",
  "Truoc khi lam...": "Trước khi làm...",
  "Sau khi lam...": "Sau khi làm...",
  "Vi, boi vi": "Vì, bởi vì",
  "Nhung, tuy nhien": "Nhưng, tuy nhiên",
  "Hon": "Hơn",
  "Khong ... bang": "Không ... bằng",
  "Nhat": "Nhất",
  "Chi, chi co": "Chỉ, chỉ có",
  "Khoang, tam": "Khoảng, tầm",
  "Khoang luc": "Khoảng lúc",
  "Nhieu": "Nhiều",
  "Khong ... lam": "Không ... lắm",
  "Hoan toan khong": "Hoàn toàn không",
  "Da, roi": "Đã, rồi",
  "Van, chua": "Vẫn, chưa",
  "Cach lam": "Cách làm",
  "Vua ... vua ...": "Vừa ... vừa ...",
  "Di de lam gi": "Đi để làm gì",
  "Toi nghi la": "Tôi nghĩ là",
  "Co le, chac la": "Có lẽ, chắc là",
  "Xin dung lam": "Xin đừng làm",
  "Khong can lam cung duoc": "Không cần làm cũng được",
  "Phai lam": "Phải làm",
  "Nen lam, nen ... hon": "Nên làm, nên ... hơn",
  "Co the lam": "Có thể làm",
}

function looksEnglish(value: string) {
  return /^[\x00-\x7F]+$/.test(value) && /[a-zA-Z]/.test(value)
}

function normalizeVietnamese(value: string) {
  return vietnameseGrammarTerms[value] ?? value
}

function localizeGrammarNotation(value: string, locale: Locale) {
  if (locale !== "vi") return value

  return value
    .replace(/\bNoun\b/g, "Danh từ")
    .replace(/\bN\b/g, "Danh từ")
    .replace(/\bVerb\b/g, "Động từ")
    .replace(/\bV\b/g, "Động từ")
    .replace(/\bSentence\b/g, "Câu")
    .replace(/\bQuestion word\b/g, "Từ nghi vấn")
    .replace(/\bPlace\b/g, "Địa điểm")
    .replace(/\bTime\b/g, "Thời gian")
    .replace(/\bPerson\b/g, "Người")
    .replace(/\bAnimal\b/g, "Động vật")
    .replace(/\bTool\b/g, "Công cụ")
    .replace(/\bNumber\b/g, "Số lượng")
    .replace(/\bquantity\b/g, "số lượng")
    .replace(/\bGroup\b/g, "Nhóm")
    .replace(/\badjective\b/g, "tính từ")
    .replace(/\bnegative\b/g, "phủ định")
    .replace(/\bpositive\b/g, "khẳng định")
    .replace(/\bpredicate\b/g, "vị ngữ")
    .replace(/\bplain-form\b/g, "thể thường")
    .replace(/\bdictionary-form\b/g, "thể từ điển")
    .replace(/\bte-form\b/g, "thể て")
    .replace(/\bta-form\b/g, "thể た")
    .replace(/\bnai-form\b/g, "thể ない")
    .replace(/\bstem\b/g, "gốc động từ")
    .replace(/\bい-adjective\b/g, "Tính từ い")
    .replace(/\bな-adjective\b/g, "Tính từ な")
    .replace(/\bい-tính từ\b/g, "Tính từ い")
    .replace(/\bな-tính từ\b/g, "Tính từ な")
    .replace(/\bform\b/g, "thể")
    .replace(/\bmovement\b/g, "di chuyển")
}

export function localizeVocabularyMeaning({
  japanese,
  hiragana,
  romaji,
  meaning,
  locale,
}: {
  japanese: string
  hiragana: string
  romaji: string
  meaning: string
  locale: Locale
}): LocalizedText {
  const isEnglishOnly = looksEnglish(meaning)
  const translatedMeaning = vietnameseVocabularyTerms[japanese]
  const vi = translatedMeaning ?? (isEnglishOnly ? "" : meaning)
  const ja = `${japanese}（${hiragana}）`

  if (locale === "ja") {
    return {
      primary: ja,
      secondary: vi ? [`VI: ${vi}`, `Romaji: ${romaji}`] : [`Romaji: ${romaji}`],
    }
  }

  return {
    primary: vi || ja,
    secondary: vi ? [`${ja}`, `Romaji: ${romaji}`] : [`Romaji: ${romaji}`],
  }
}

export function localizeGrammarContent({
  pattern,
  meaning,
  structure,
  usageNote,
  locale,
}: {
  pattern: string
  meaning: string
  structure: string
  usageNote?: string
  locale: Locale
}) {
  const viMeaning = normalizeVietnamese(meaning)
  const viUsage = usageNote ? normalizeVietnamese(usageNote) : undefined

  if (locale === "ja") {
    return {
      pattern,
      meaning: pattern,
      structure,
      usageNote: viUsage,
      secondary: [`VI: ${viMeaning}`],
    }
  }

  return {
    pattern: localizeGrammarNotation(pattern, locale),
    meaning: viMeaning,
    structure: localizeGrammarNotation(structure, locale),
    usageNote: viUsage,
    secondary: [],
  }
}
