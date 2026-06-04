(() => {
function getMeta(selector) {
  return document.querySelector(selector)?.getAttribute("content")?.trim() ?? ""
}

function getText(selector) {
  return document.querySelector(selector)?.textContent?.trim() ?? ""
}

function unique(values) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function sendImportPayload(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "todaii-import", payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      resolve(response)
    })
  })
}

function safeDebugFileName(title) {
  const normalized = String(title || "todaii-article")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)

  return `${normalized || "todaii-article"}-crawl-debug.txt`
}

function downloadCrawlDebugText(payload, importResult) {
  const lines = [
    "TODAII crawl debug",
    `Generated at: ${new Date().toISOString()}`,
    `Page URL: ${location.href}`,
    "",
    "Import result:",
    JSON.stringify(importResult ?? null, null, 2),
    "",
    "Payload:",
    JSON.stringify(payload, null, 2),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = safeDebugFileName(payload?.title)
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function parseStructuredArticle() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((script) => {
      try {
        return JSON.parse(script.textContent ?? "")
      } catch {
        return null
      }
    })
    .find((item) => item?.["@type"] === "Article")
}

function normalizedBodyText() {
  return (document.body.textContent ?? "").replace(/\s+/g, " ").trim()
}

function detailRoot() {
  return document.querySelector("#detail_news") || document.querySelector("main") || document.body
}

function rawDetailHtml() {
  return detailRoot()?.outerHTML ?? document.documentElement.outerHTML
}

function hasJapanese(text) {
  return /[\u3041-\u3096\u30a1-\u30ff\u4e00-\u9fff]/.test(text)
}

const todaiiCategories = [
  "Nhật ký của Tomo",
  "Có gì mới",
  "Tin tức giải trí",
  "Tin tức văn hóa",
  "Tin tức đời sống",
  "Truyện ngắn",
  "Tin tức sức khỏe",
  "Tin tức giáo dục",
  "Khám phá ẩm thực",
  "Kỹ năng sống",
  "Tin tức kinh tế",
  "Tin tức công nghệ",
  "Tin tức thể thao",
  "47 tỉnh thành Nhật Bản",
  "Chỉ có ở Nhật Bản",
  "Văn hóa Nhật Bản",
  "Góc nhìn mới",
  "Nấu ăn cuối tuần",
  "Bạn có biết?",
  "Lựa chọn trong tuần",
]

function extractArticleText(fallback) {
  const bodyText = normalizedBodyText()
  const match = bodyText.match(
    new RegExp("D\\u1ecbch song ng\\u1eef\\s+(?:Th\\u00eam b\\u1ea3n d\\u1ecbch\\s+)?(.+?)\\s+Ngu\\u1ed3n:")
  )
  const articleText = match?.[1]?.trim()

  return articleText && hasJapanese(articleText) && articleText.length > fallback.length ? articleText : fallback
}

function extractArticleTextFromParagraphs(fallback) {
  const paragraphs = Array.from(document.querySelectorAll("p, article span, main span"))
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(hasJapanese)
    .filter((text) => text.includes("\u3002"))

  const joined = unique(paragraphs).join("")

  return joined.length > fallback.length ? joined : fallback
}

function textWithoutRubyReading(element) {
  let text = ""

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? ""
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue

    const child = node
    const tagName = child.tagName.toLowerCase()
    if (tagName === "rt" || tagName === "rp") continue

    text += textWithoutRubyReading(child)
  }

  return text
}

function mergePlainTokens(tokens) {
  const merged = []

  for (const token of tokens) {
    if (!token.text) continue

    const previous = merged.at(-1)
    if (previous && !previous.reading && !token.reading) {
      previous.text += token.text
    } else {
      merged.push(token)
    }
  }

  return merged
}

function extractTokensFromNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: node.textContent ?? "" }]
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const element = node
  const tagName = element.tagName.toLowerCase()

  if (tagName === "rt" || tagName === "rp") return []

  if (tagName === "ruby") {
    const reading = Array.from(element.querySelectorAll("rt"))
      .map((item) => item.textContent?.trim() ?? "")
      .filter(Boolean)
      .join("")
    const text = textWithoutRubyReading(element).replace(/\s+/g, "").trim()

    return text ? [{ text, reading: reading || null }] : []
  }

  return mergePlainTokens(Array.from(element.childNodes).flatMap(extractTokensFromNode))
}

function extractArticleBlocks() {
  const candidates = Array.from(document.querySelectorAll("#detail_news p, article p, main p, p"))
  const blocks = []
  const seen = new Set()

  for (const element of candidates) {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? ""
    if (!hasJapanese(text) || !text.includes("\u3002")) continue

    const tokens = mergePlainTokens(Array.from(element.childNodes).flatMap(extractTokensFromNode))
      .map((token) => ({
        text: token.text.replace(/\s+/g, " "),
        reading: token.reading ?? null,
      }))
      .filter((token) => token.text.trim())

    const plainText = tokens.map((token) => token.text).join("").replace(/\s+/g, " ").trim()
    if (!plainText || seen.has(plainText)) continue

    seen.add(plainText)
    blocks.push({
      text: plainText,
      tokens,
    })
  }

  return blocks
}

function extractLevel(title) {
  const lines = (document.body.innerText || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const titleIndex = lines.findIndex((line) => line === title)
  const nearbyLevel = lines.slice(Math.max(titleIndex + 1, 0), titleIndex + 8).find((line) => /^N[1-5]$/.test(line))

  return nearbyLevel ?? "unknown"
}

function extractCategory(title) {
  const sectionMeta =
    getMeta('meta[property="article:section"]') ||
    getMeta('meta[name="article:section"]') ||
    getMeta('meta[name="keywords"]')

  const metaCategory = todaiiCategories.find((category) => sectionMeta.includes(category))
  if (metaCategory) return metaCategory

  const lines = (document.body.innerText || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const titleIndex = lines.findIndex((line) => line === title)
  const nearbyText =
    titleIndex >= 0
      ? lines.slice(Math.max(0, titleIndex - 12), titleIndex + 16).join(" ")
      : lines.slice(0, 80).join(" ")
  const nearbyCategory = todaiiCategories.find((category) => nearbyText.includes(category))
  if (nearbyCategory) return nearbyCategory

  const breadcrumbText = Array.from(document.querySelectorAll("nav a, [aria-label*='breadcrumb' i] a, a[href*='/category'], a[href*='/news/']"))
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .join(" ")
  const breadcrumbCategory = todaiiCategories.find((category) => breadcrumbText.includes(category))

  return breadcrumbCategory ?? null
}

function extractLevelStats() {
  const root = detailRoot()
  const candidates = Array.from(root.querySelectorAll("div, section"))

  for (const element of candidates) {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? ""
    const matches = Array.from(text.matchAll(/\b(N[1-5])\s*(\d{1,3})%/g))

    if (matches.length >= 2) {
      return matches.map((match) => ({
        level: match[1],
        percentage: Math.min(Number(match[2]), 100),
      }))
    }
  }

  return []
}

function extractAudioUrl() {
  const audioUrl = document.querySelector("audio[src]")?.getAttribute("src")?.trim()
  if (audioUrl) return new URL(audioUrl, location.href).href

  const sourceUrl = document.querySelector("audio source[src]")?.getAttribute("src")?.trim()
  if (sourceUrl) return new URL(sourceUrl, location.href).href

  const rawHtml = rawDetailHtml()
  const match = rawHtml.match(/https?:\/\/[^"'\s<>]+\.mp3(?:\?[^"'\s<>]*)?/i)

  return match?.[0] ?? null
}

function visibleText(element) {
  return element.textContent?.replace(/\s+/g, " ").trim() ?? ""
}

function isHighlightElement(element) {
  const tagName = element.tagName.toLowerCase()
  const className = String(element.getAttribute("class") ?? "")
  const style = window.getComputedStyle(element)
  const hasMarkedTag = ["mark", "u", "a", "button"].includes(tagName)
  const hasMarkedClass = /underline|highlight|vocab|vocabulary|grammar|word|level|jlpt|n[1-5]|border-b|decoration|text-primary|cursor-pointer/i.test(
    className
  )
  const hasUnderline = style.textDecorationLine.includes("underline") || style.borderBottomWidth !== "0px"
  const hasBackground =
    style.backgroundColor &&
    style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    style.backgroundColor !== "transparent"

  return hasMarkedTag || hasMarkedClass || hasUnderline || hasBackground
}

function nearestHighlightLevel(element) {
  let current = element

  for (let depth = 0; current && depth < 5; depth += 1) {
    const searchable = [
      current.textContent,
      current.getAttribute("class"),
      current.getAttribute("title"),
      current.getAttribute("aria-label"),
      current.getAttribute("data-level"),
      current.getAttribute("data-jlpt"),
    ]
      .filter(Boolean)
      .join(" ")
    const match = searchable.match(/\bN[1-5]\b/i)
    if (match) return match[0].toUpperCase()

    current = current.parentElement
  }

  return null
}

function nearestHighlightType(element) {
  let current = element

  for (let depth = 0; current && depth < 5; depth += 1) {
    const searchable = [
      current.textContent,
      current.getAttribute("class"),
      current.getAttribute("title"),
      current.getAttribute("aria-label"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (/grammar|ngữ pháp|ngu phap/.test(searchable)) return "grammar"
    if (/vocab|vocabulary|từ vựng|tu vung/.test(searchable)) return "vocabulary"

    current = current.parentElement
  }

  return null
}

function extractArticleHighlights() {
  const root = detailRoot()
  const candidates = Array.from(root.querySelectorAll("mark, u, a, button, span, ruby, rt"))
  const highlights = []
  const seen = new Set()

  for (const element of candidates) {
    const text = visibleText(element)
    if (!hasJapanese(text)) continue
    if (text.length < 2 || text.length > 32) continue
    if (/[。！？\n]/.test(text)) continue
    if (!isHighlightElement(element)) continue

    const key = text
    if (seen.has(key)) continue
    seen.add(key)

    highlights.push({
      text,
      level: nearestHighlightLevel(element),
      type: nearestHighlightType(element),
    })
  }

  return highlights
}

function sectionCards(label, fallbackLabel) {
  return Array.from(document.querySelectorAll("h2"))
    .find((heading) => {
      const text = heading.textContent ?? ""
      return text.includes(label) || text.includes(fallbackLabel)
    })
    ?.parentElement?.parentElement?.querySelectorAll(".border-card-base")
}

function extractVocabulary() {
  const cards = sectionCards("T\u1eeb v\u1ef1ng", "Vocabulary")

  if (!cards?.length) return []

  return Array.from(cards).map((card) => {
    const text = card.textContent?.replace(/\s+/g, " ").trim() ?? ""
    const level = text.match(/\bN[1-5]\b/)?.[0] ?? null

    return {
      text,
      level,
    }
  })
}

function extractGrammar() {
  const cards = sectionCards("Ng\u1eef ph\u00e1p", "Grammar")

  if (!cards?.length) return []

  return Array.from(cards).map((card) => {
    const lines = unique((card.textContent ?? "").split("\n"))
    const text = lines.join(" ").replace(/\s+/g, " ").trim()
    const level = text.match(/\bN[1-5]\b/)?.[0] ?? null

    return {
      text,
      level,
    }
  })
}

function cleanQuestionLine(line) {
  return line.replace(/\s+/g, " ").trim()
}

function isQuestionNoise(line) {
  return /^(Câu hỏi|Nộp bài|Từ vựng|Ngữ pháp|Furigana|\d+\/\d+)$/i.test(line)
}

function optionAt(lines, startIndex, key) {
  const line = lines[startIndex] ?? ""
  const inlineMatch = line.match(new RegExp(`^${key}\\s+(.+)$`))

  if (inlineMatch?.[1]) {
    return {
      key,
      text: inlineMatch[1].trim(),
      index: startIndex,
      nextIndex: startIndex + 1,
    }
  }

  if (line === key && lines[startIndex + 1]) {
    return {
      key,
      text: lines[startIndex + 1],
      index: startIndex,
      nextIndex: startIndex + 2,
    }
  }

  return null
}

function findOption(lines, key, fromIndex, maxDistance = 8) {
  const endIndex = Math.min(lines.length, fromIndex + maxDistance)

  for (let index = fromIndex; index < endIndex; index += 1) {
    const option = optionAt(lines, index, key)
    if (option) return option
  }

  return null
}

function questionBefore(lines, fromIndex, boundaryIndex) {
  const candidates = lines
    .slice(boundaryIndex, fromIndex)
    .map(cleanQuestionLine)
    .filter((line) => line && !isQuestionNoise(line))
    .filter((line) => !/^[A-D]($|\s+)/.test(line))

  return candidates.at(-1) ?? ""
}

function parseQuestionGroups(lines) {
  const counterQuestions = parseQuestionGroupsByCounter(lines)
  if (counterQuestions.length > 0) return counterQuestions

  const questions = []
  let boundaryIndex = 0

  for (let index = 0; index < lines.length; index += 1) {
    const optionA = optionAt(lines, index, "A")
    if (!optionA) continue

    const optionB = findOption(lines, "B", optionA.nextIndex)
    const optionC = optionB ? findOption(lines, "C", optionB.nextIndex) : null
    const optionD = optionC ? findOption(lines, "D", optionC.nextIndex) : null

    if (!optionB || !optionC || !optionD) continue

    const question = questionBefore(lines, optionA.index, boundaryIndex)
    if (!question) continue

    const options = [optionA, optionB, optionC, optionD].map((option) => ({
      key: option.key,
      text: option.text,
    }))

    questions.push({
      question,
      options,
      rawText: [question, ...options.flatMap((option) => [option.key, option.text])].join(" "),
    })

    boundaryIndex = optionD.nextIndex
    index = optionD.nextIndex - 1
  }

  return questions
}

function parseQuestionGroupsByCounter(lines) {
  const questions = []
  let boundaryIndex = 0

  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\d+\/\d+$/.test(lines[index] ?? "")) continue

    const optionA = findOption(lines, "A", index + 1, 5)
    const optionB = optionA ? findOption(lines, "B", optionA.nextIndex, 5) : null
    const optionC = optionB ? findOption(lines, "C", optionB.nextIndex, 5) : null
    const optionD = optionC ? findOption(lines, "D", optionC.nextIndex, 5) : null

    if (!optionA || !optionB || !optionC || !optionD) continue

    const candidates = lines
      .slice(boundaryIndex, index)
      .map(cleanQuestionLine)
      .filter((line) => line && !isQuestionNoise(line))
      .filter((line) => !/^[A-D]($|\s+)/.test(line))
    const question = candidates.at(-1) ?? ""
    if (!question) continue

    const options = [optionA, optionB, optionC, optionD].map((option) => ({
      key: option.key,
      text: option.text,
    }))

    questions.push({
      question,
      options,
      rawText: [question, lines[index], ...options.flatMap((option) => [option.key, option.text])].join(" "),
    })

    boundaryIndex = optionD.nextIndex
    index = optionD.nextIndex - 1
  }

  return questions
}

function textWithoutReadingsFromNode(element) {
  return textWithoutRubyReading(element).replace(/\s+/g, " ").trim()
}

function visibleElements(root, selector) {
  return Array.from(root.querySelectorAll(selector)).filter(isVisibleElement)
}

function visibleQuestionCardRoot(root, counterElement) {
  let current = counterElement

  for (let depth = 0; current && depth < 10; depth += 1) {
    const text = visibleText(current)
    const hasCounter = /\b\d+\s*\/\s*\d+\b/.test(text)
    const hasOptions = ["A", "B", "C", "D"].every((key) => new RegExp(`\\b${key}\\b`).test(text))

    if (hasCounter && hasOptions && hasJapanese(text) && isVisibleElement(current)) {
      return current
    }

    current = current.parentElement
  }

  return root
}

function currentQuestionCardParts() {
  const root = questionSectionRoot()
  const counterElement = visibleElements(root, "span, div")
    .find((element) => /^\d+\s*\/\s*\d+$/.test(cleanQuestionLine(element.textContent ?? "")))
  const counter = cleanQuestionLine(counterElement?.textContent ?? "")
  const counterMatch = counter.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (!counterElement || !counterMatch) return null

  const cardRoot = visibleQuestionCardRoot(root, counterElement)

  return {
    root,
    counter,
    counterMatch,
    cardRoot,
  }
}

function parseVisibleQuestionCard() {
  const parts = currentQuestionCardParts()
  if (!parts) return null
  const { counter, counterMatch, cardRoot } = parts

  const questionElement =
    visibleElements(cardRoot, "p.one-click-trans")[0] ||
    visibleElements(cardRoot, "p.japanese-body-l-regular")[0] ||
    visibleElements(cardRoot, "p").find((element) => hasJapanese(element.textContent ?? ""))
  const question = questionElement ? textWithoutReadingsFromNode(questionElement) : ""
  if (!question) return null

  const options = ["A", "B", "C", "D"]
    .map((key) => {
      const optionRoot = visibleElements(cardRoot, "[tabindex='0'], button, .cursor-pointer")
        .find((element) => {
          const firstSpan = element.querySelector("span")
          return cleanQuestionLine(firstSpan?.textContent ?? "") === key
        })
      if (!optionRoot) return null

      const textElement = Array.from(optionRoot.querySelectorAll("span"))
        .find((element) => cleanQuestionLine(element.textContent ?? "") !== key)
      const text = textElement ? textWithoutReadingsFromNode(textElement) : ""
      const optionClassName = String(optionRoot.getAttribute("class") ?? "")
      const isCorrect = /bg-smt-green|text-smt-green|border-smt-green/i.test(optionClassName)

      return text ? { key, text, isCorrect } : null
    })
    .filter((option) => option !== null)

  if (options.length !== 4) return null
  const correctAnswer = options.find((option) => option.isCorrect)?.key ?? null
  const cleanOptions = options.map(({ key, text }) => ({ key, text }))

  return {
    index: Number(counterMatch[1]),
    total: Number(counterMatch[2]),
    question,
    options: cleanOptions,
    correctAnswer,
    rawText: [question, counter, ...options.flatMap((option) => [option.key, option.text])].join(" "),
  }
}

function normalizedActionText(value) {
  return cleanQuestionLine(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
}

function findQuestionButtonByText(matchers) {
  return visibleElements(questionSectionRoot(), "button")
    .filter((button) => !button.disabled)
    .find((button) => {
      const text = normalizedActionText(button.textContent ?? "")
      return matchers.some((matcher) => text.includes(matcher))
    })
}

function clickVisibleQuestionOption(key) {
  const parts = currentQuestionCardParts()
  if (!parts) return false

  const optionRoot = visibleElements(parts.cardRoot, "[tabindex='0'], button, .cursor-pointer")
    .find((element) => {
      const firstSpan = element.querySelector("span")
      return cleanQuestionLine(firstSpan?.textContent ?? "") === key
    })

  if (!optionRoot) return false
  optionRoot.click()
  return true
}

async function revealQuestionAnswersForCrawl() {
  const visibleQuestion = parseVisibleQuestionCard()
  if (!visibleQuestion) {
    return { attempted: false, revealed: false, reason: "question_not_found" }
  }

  if (visibleQuestion.correctAnswer) {
    return { attempted: false, revealed: true, reason: "already_revealed" }
  }

  const existingDetailButton = findQuestionButtonByText(["dap an chi tiet", "answer"])
  if (existingDetailButton) {
    existingDetailButton.click()
    await wait(1000)
    return {
      attempted: false,
      revealed: Boolean(parseVisibleQuestionCard()?.correctAnswer),
      reason: "opened_existing_detail",
    }
  }

  const expectedTotal = visibleQuestion.total
  const maxSteps = Math.min(Math.max(expectedTotal, 5), 10)

  for (let step = 0; step < maxSteps; step += 1) {
    const current = parseVisibleQuestionCard()
    const { previous } = questionNavigationButtons()
    if (!previous || current?.index === 1) break
    previous.click()
    await wait(500)
  }

  let answeredCount = 0
  for (let step = 0; step < maxSteps; step += 1) {
    const current = parseVisibleQuestionCard()
    if (!current) break

    if (clickVisibleQuestionOption("A")) answeredCount += 1
    await wait(200)

    if (current.index >= expectedTotal) break
    const { next } = questionNavigationButtons()
    if (!next) break
    next.click()
    await wait(500)
  }

  const submitButton = findQuestionButtonByText(["nop bai", "submit"])
  if (!submitButton) {
    return { attempted: true, revealed: false, reason: "submit_button_not_found", answeredCount }
  }

  submitButton.click()
  await wait(1200)

  const answerDetailButton = findQuestionButtonByText(["dap an chi tiet", "answer"])
  if (!answerDetailButton) {
    return { attempted: true, revealed: false, reason: "detail_button_not_found", answeredCount }
  }

  answerDetailButton.click()
  await wait(1200)

  return {
    attempted: true,
    revealed: Boolean(parseVisibleQuestionCard()?.correctAnswer),
    reason: "auto_submitted",
    answeredCount,
  }
}

function mergeQuestions(questionSets) {
  const merged = []
  const seen = new Set()

  for (const question of questionSets.flat()) {
    const key = cleanQuestionLine(question.question ?? question.rawText ?? "")
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(question)
  }

  return merged
}

function questionLinesFromElement(element) {
  const ownLines = (element.innerText || element.textContent || "")
    .split(/\n+/)
    .map(cleanQuestionLine)
    .filter(Boolean)

  const childLines = Array.from(element.querySelectorAll("p, button, span, div"))
    .map((child) => child.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter((line) => line && line.length < 220)

  return unique([...ownLines, ...childLines])
}

function extractQuestionsFromDomCandidates() {
  const root = detailRoot()
  const candidates = Array.from(root.querySelectorAll("section, article, div, form"))
    .map((element) => ({
      element,
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
    }))
    .filter(({ text }) => /\b\d+\/\d+\b/.test(text))
    .filter(({ text }) => /\bA\b/.test(text) && /\bB\b/.test(text) && /\bC\b/.test(text) && /\bD\b/.test(text))
    .sort((a, b) => a.text.length - b.text.length)
    .slice(0, 25)

  return mergeQuestions(
    candidates.map(({ element }) => {
      const lines = questionLinesFromElement(element)
      return parseQuestionGroups(lines)
    })
  )
}

function extractQuestionsFromCurrentDom() {
  const domQuestions = extractQuestionsFromDomCandidates()
  if (domQuestions.length > 1) return domQuestions

  const normalizedText = normalizedBodyText()
  const allLines = (document.body.innerText || document.body.textContent || "")
    .split(/\n+/)
    .map(cleanQuestionLine)
    .filter(Boolean)
  const sectionStart = allLines.findIndex((line) => line === "Câu hỏi")
  const sectionEnd = allLines.findIndex((line, index) => index > sectionStart && line === "Từ vựng")
  const lines =
    sectionStart >= 0 && sectionEnd > sectionStart
      ? allLines.slice(sectionStart, sectionEnd)
      : allLines
  const groupedQuestions = parseQuestionGroups(lines)

  if (groupedQuestions.length > 0) return mergeQuestions([domQuestions, groupedQuestions])

  const sectionMatch = normalizedText.match(
    new RegExp("C\\u00e2u h\\u1ecfi\\s+N\\u1ed9p b\\u00e0i\\s+(.+?)\\s+T\\u1eeb v\\u1ef1ng")
  )

  if (!sectionMatch) return []

  const sectionText = sectionMatch[1].trim()
  const questionMatch = sectionText.match(/(.+?)\s+\d+\/\d+\s+A\s+/)
  const optionMatches = Array.from(sectionText.matchAll(/\s([A-D])\s+(.+?)(?=\s[A-D]\s+|$)/g))

  const compactQuestions = optionMatches.length
    ? [
        {
          question: questionMatch?.[1]?.trim() ?? sectionText,
          options: optionMatches.map((match) => ({
            key: match[1],
            text: match[2].trim(),
          })),
          rawText: sectionText,
        },
      ]
    : []

  return mergeQuestions([domQuestions, compactQuestions])
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isVisibleElement(element) {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"
}

function questionSectionRoot() {
  const heading = Array.from(document.querySelectorAll("h2, h3, section div, div"))
    .find((element) => cleanQuestionLine(element.textContent ?? "") === "Câu hỏi")

  return heading?.closest("section") || heading?.parentElement?.parentElement || detailRoot()
}

function findNextQuestionButton() {
  const nav = questionNavigationButtons()
  if (nav.next) return nav.next

  const root = questionSectionRoot()
  const buttons = Array.from(root.querySelectorAll("button"))
    .filter((button) => !button.disabled)
    .filter(isVisibleElement)
    .filter((button) => {
      const text = cleanQuestionLine(button.textContent ?? "")
      if (/^[A-D]($|\s+)/.test(text)) return false
      if (/Nộp bài|submit|play|audio/i.test(text)) return false
      return true
    })

  const explicit = buttons.find((button) => {
    const searchable = [
      button.textContent,
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.getAttribute("class"),
    ]
      .filter(Boolean)
      .join(" ")

    return /next|sau|tiếp|right|chevron-right|arrow-right/i.test(searchable)
  })
  if (explicit) return explicit

  const rootRect = root.getBoundingClientRect()
  return buttons
    .map((button) => ({
      button,
      rect: button.getBoundingClientRect(),
    }))
    .filter(({ rect }) => rect.left > rootRect.left + rootRect.width / 2)
    .sort((a, b) => b.rect.left - a.rect.left)[0]?.button ?? null
}

function questionNavigationButtons() {
  const root = questionSectionRoot()
  const counterElement = Array.from(root.querySelectorAll("span, div"))
    .find((element) => /^\d+\s*\/\s*\d+$/.test(cleanQuestionLine(element.textContent ?? "")))
  const container = counterElement?.parentElement
  const buttons = container
    ? Array.from(container.querySelectorAll("button")).filter((button) => !button.disabled && isVisibleElement(button))
    : []

  return {
    previous: buttons[0] ?? null,
    next: buttons.at(-1) ?? null,
  }
}

function questionTotalFromPage() {
  const text = (questionSectionRoot().textContent || document.body.textContent || "").replace(/\s+/g, " ")
  const matches = Array.from(text.matchAll(/\b(\d+)\/(\d+)\b/g))
  const totals = matches.map((match) => Number(match[2])).filter((value) => Number.isFinite(value))

  return totals.length ? Math.max(...totals) : null
}

async function extractQuestions() {
  const visibleQuestion = parseVisibleQuestionCard()
  if (visibleQuestion) {
    const questionsByIndex = new Map()
    const expectedTotal = visibleQuestion.total
    const maxSteps = Math.min(Math.max(expectedTotal, 5), 10)

    function saveVisibleQuestion() {
      const current = parseVisibleQuestionCard()
      if (current) questionsByIndex.set(current.index, current)
      return current
    }

    saveVisibleQuestion()

    for (let step = 0; step < maxSteps && questionsByIndex.size < expectedTotal; step += 1) {
      const current = parseVisibleQuestionCard()
      const { previous } = questionNavigationButtons()
      if (!previous || current?.index === 1) break
      previous.click()
      await wait(500)
      saveVisibleQuestion()
    }

    for (let step = 0; step < maxSteps && questionsByIndex.size < expectedTotal; step += 1) {
      const current = parseVisibleQuestionCard()
      const { next } = questionNavigationButtons()
      if (!next || current?.index === expectedTotal) break
      next.click()
      await wait(500)
      saveVisibleQuestion()
    }

    const questions = Array.from(questionsByIndex.values())
      .sort((a, b) => a.index - b.index)
      .map(({ index: _index, total: _total, ...question }) => question)

    if (questions.length > 0) return questions
  }

  let questions = extractQuestionsFromCurrentDom()
  const expectedTotal = questionTotalFromPage()
  const maxSteps = Math.min(Math.max(expectedTotal ?? 5, 5), 10)
  let staleClicks = 0

  for (let step = 0; step < maxSteps && (!expectedTotal || questions.length < expectedTotal); step += 1) {
    const nextButton = findNextQuestionButton()
    if (!nextButton) break

    const beforeCount = questions.length
    nextButton.click()
    await wait(500)

    questions = mergeQuestions([questions, extractQuestionsFromCurrentDom()])
    staleClicks = questions.length === beforeCount ? staleClicks + 1 : 0
    if (staleClicks >= 2) break
  }

  return questions
}

async function crawlTodaii() {
  if (!location.hostname.includes("todaiinews.com")) {
    alert("Open a TODAII news page before running this extension.")
    return
  }

  const structuredArticle = parseStructuredArticle()
  const title =
    getText("h1") ||
    structuredArticle?.headline ||
    getMeta('meta[property="og:title"]').replace(" | Todaii Japanese", "")

  const fallbackArticleText =
    structuredArticle?.description ||
    getMeta('meta[name="description"]') ||
    getMeta('meta[property="og:description"]')

  const imageUrl = structuredArticle?.image?.url || getMeta('meta[property="og:image"]') || null

  const publishedAt =
    structuredArticle?.datePublished || getMeta('meta[property="article:published_time"]') || null

  const answerRevealResult = await revealQuestionAnswersForCrawl()
  const root = detailRoot()
  const bodyText = root?.innerText || document.body.innerText || document.body.textContent || ""

  const payload = {
    sourceUrl: location.href,
    provider: "TODAII",
    title,
    level: extractLevel(title),
    category: extractCategory(title),
    articleText: extractArticleTextFromParagraphs(extractArticleText(fallbackArticleText)),
    articleBlocks: extractArticleBlocks(),
    imageUrl,
    audioUrl: extractAudioUrl(),
    publishedAt,
    questions: await extractQuestions(),
    answerRevealResult,
    levelStats: extractLevelStats(),
    highlights: extractArticleHighlights(),
    vocabulary: extractVocabulary(),
    grammar: extractGrammar(),
    rawText: bodyText.replace(/[ \t]+/g, " ").trim(),
    rawHtml: rawDetailHtml(),
  }

  const result = await sendImportPayload(payload)
  downloadCrawlDebugText(payload, result)

  if (!result?.ok) {
    alert(`Import failed. Crawl debug txt downloaded. ${JSON.stringify(result)}`)
    return
  }

  alert(`Imported TODAII article: ${result.body.articleId}. Crawl debug txt downloaded.`)
}

crawlTodaii().catch((error) => {
  alert(`Crawler error: ${error instanceof Error ? error.message : String(error)}`)
})
})()
