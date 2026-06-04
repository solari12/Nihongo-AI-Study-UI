export type QuizOptionLabel = "A" | "B" | "C" | "D"

export type ChatQuizOption = {
  label: QuizOptionLabel
  text: string
}

export type ChatQuizCard = {
  id: string
  question: string
  options: ChatQuizOption[]
  answer?: QuizOptionLabel
  explanation?: string
}

export type ParsedChatQuiz = {
  cards: ChatQuizCard[]
  text: string
}

const optionLabels = new Set<QuizOptionLabel>(["A", "B", "C", "D"])

function stripDiacritics(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
}

function normalizedLabel(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanQuizLine(line: string) {
  return line
    .trim()
    .replace(/\*\*/g, "")
    .replace(/^[-\u2013\u2014]\s*/, "")
    .trim()
}

function matchQuestionLine(line: string) {
  const cleaned = cleanQuizLine(line)
  const normalized = normalizedLabel(cleaned)
  const match =
    normalized.match(/^(?:cau|question)\s*(\d+)?\s*(.*)$/i) ??
    normalized.match(/^q\s*(\d+)\s*(.*)$/i)
  if (!match) return null

  const separatorIndex = cleaned.search(/[:.)-]/)
  const questionText = separatorIndex >= 0 ? cleaned.slice(separatorIndex + 1).trim() : match[2].trim()

  return {
    number: match[1],
    questionText,
  }
}

function matchOptionLine(line: string) {
  const match = cleanQuizLine(line).match(/^([A-D])\s*[.)-]\s*(.*)$/i)
  if (!match) return null

  const label = match[1].toUpperCase() as QuizOptionLabel
  if (!optionLabels.has(label)) return null

  return {
    label,
    text: match[2].trim(),
  }
}

function matchAnswerLine(line: string) {
  const cleaned = cleanQuizLine(line)
  const normalized = normalizedLabel(cleaned)
  if (!/^(dap an|dap an dung|answer|correct answer|correct)\b/.test(normalized)) return null

  const match =
    cleaned.match(/[:\uFF1A]\s*([A-D])\b/i) ??
    cleaned.match(/\b(?:la|is)\s+([A-D])\b/i) ??
    cleaned.match(/\b([A-D])\b/i)
  const label = match?.[1]?.toUpperCase() as QuizOptionLabel | undefined

  return label && optionLabels.has(label) ? label : null
}

function matchExplanationLine(line: string) {
  const cleaned = cleanQuizLine(line)
  const normalized = normalizedLabel(cleaned)
  if (!/^(giai thich|explanation)\b/.test(normalized)) return null

  const separatorIndex = cleaned.search(/[:\uFF1A]/)
  return separatorIndex >= 0 ? cleaned.slice(separatorIndex + 1).trim() : ""
}

export function parseChatQuizCards(content: string): ParsedChatQuiz {
  const lines = content.split(/\r?\n/)
  const cards: ChatQuizCard[] = []
  const consumed = new Set<number>()
  let cursor = 0

  while (cursor < lines.length) {
    const questionMatch = matchQuestionLine(lines[cursor])
    if (!questionMatch) {
      cursor += 1
      continue
    }

    const questionStart = cursor
    let questionText = questionMatch.questionText
    const options: ChatQuizOption[] = []
    let answer: QuizOptionLabel | undefined
    let explanation: string | undefined
    let next = cursor + 1

    if (!questionText) {
      while (next < lines.length && !cleanQuizLine(lines[next])) {
        next += 1
      }
      questionText = cleanQuizLine(lines[next] ?? "")
      next += 1
    }

    while (next < lines.length) {
      const line = cleanQuizLine(lines[next])
      if (matchQuestionLine(line) && options.length) break

      const option = matchOptionLine(line)
      if (option) {
        if (!option.text) {
          let optionTextLine = next + 1
          while (optionTextLine < lines.length && !cleanQuizLine(lines[optionTextLine])) {
            optionTextLine += 1
          }

          const nextLine = cleanQuizLine(lines[optionTextLine] ?? "")
          if (
            nextLine &&
            !matchQuestionLine(nextLine) &&
            !matchOptionLine(nextLine) &&
            !matchAnswerLine(nextLine) &&
            matchExplanationLine(nextLine) === null
          ) {
            option.text = nextLine
            next = optionTextLine
          }
        }

        options.push(option)
        next += 1
        continue
      }

      const nextAnswer = matchAnswerLine(line)
      if (nextAnswer) {
        answer = nextAnswer
        next += 1
        continue
      }

      const nextExplanation = matchExplanationLine(line)
      if (nextExplanation !== null) {
        explanation = nextExplanation
        next += 1
        continue
      }

      next += 1
    }

    const validOptions = options.filter((option) => option.text)

    if (questionText && validOptions.length >= 2) {
      const questionNumber = questionMatch.number ?? String(cards.length + 1)
      cards.push({
        id: `quiz-${questionNumber}-${questionStart}`,
        question: questionText,
        options: validOptions,
        answer,
        explanation,
      })

      for (let index = questionStart; index < next; index += 1) {
        consumed.add(index)
      }

      cursor = next
      continue
    }

    cursor += 1
  }

  return {
    cards,
    text: lines.filter((_, index) => !consumed.has(index)).join("\n").trim(),
  }
}
