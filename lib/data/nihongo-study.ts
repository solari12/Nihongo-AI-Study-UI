export type VocabularyItem = {
  id: number
  japanese: string
  hiragana: string
  romaji: string
  vietnamese: string
  type: string
  topic: string
  imageUrl?: string | null
  example: {
    japanese: string
    hiragana?: string
    vietnamese: string
  }
}

export type GrammarStatus = "Chưa học" | "Đang học" | "Đã hoàn thành"

export type GrammarItem = {
  id: number
  pattern: string
  meaning: string
  structure: string
  example: {
    japanese: string
    vietnamese: string
  }
  usageNote: string
  difficulty: "Dễ" | "Trung bình" | "Khó"
  status: GrammarStatus
}

export type QuizQuestionItem = {
  id: number
  question: string
  type: "vocabulary" | "grammar"
  difficulty: "easy" | "medium" | "hard"
  answers: {
    id: string
    text: string
  }[]
  correctAnswer: string
  explanation: string
  topic: string
}

export const vocabularyTopics = [
  "Tất cả",
  "Chào hỏi",
  "Gia đình",
  "Trường học",
  "Thời gian",
  "Đồ vật",
  "Động từ",
  "Tính từ",
]

export const vocabularyData: VocabularyItem[] = [
  {
    id: 1,
    japanese: "学生",
    hiragana: "がくせい",
    romaji: "gakusei",
    vietnamese: "sinh viên",
    type: "Danh từ",
    topic: "Trường học",
    example: {
      japanese: "私は学生です。",
      vietnamese: "Tôi là sinh viên.",
    },
  },
  {
    id: 2,
    japanese: "先生",
    hiragana: "せんせい",
    romaji: "sensei",
    vietnamese: "giáo viên",
    type: "Danh từ",
    topic: "Trường học",
    example: {
      japanese: "田中さんは先生です。",
      vietnamese: "Anh Tanaka là giáo viên.",
    },
  },
  {
    id: 3,
    japanese: "日本",
    hiragana: "にほん",
    romaji: "nihon",
    vietnamese: "Nhật Bản",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "日本は美しい国です。",
      vietnamese: "Nhật Bản là đất nước xinh đẹp.",
    },
  },
  {
    id: 4,
    japanese: "本",
    hiragana: "ほん",
    romaji: "hon",
    vietnamese: "sách",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "これは私の本です。",
      vietnamese: "Đây là sách của tôi.",
    },
  },
  {
    id: 5,
    japanese: "水",
    hiragana: "みず",
    romaji: "mizu",
    vietnamese: "nước",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "水をください。",
      vietnamese: "Cho tôi xin nước.",
    },
  },
  {
    id: 6,
    japanese: "食べる",
    hiragana: "たべる",
    romaji: "taberu",
    vietnamese: "ăn",
    type: "Động từ",
    topic: "Động từ",
    example: {
      japanese: "朝ごはんを食べます。",
      vietnamese: "Tôi ăn bữa sáng.",
    },
  },
  {
    id: 7,
    japanese: "大きい",
    hiragana: "おおきい",
    romaji: "ookii",
    vietnamese: "to, lớn",
    type: "Tính từ",
    topic: "Tính từ",
    example: {
      japanese: "この家は大きいです。",
      vietnamese: "Ngôi nhà này to.",
    },
  },
  {
    id: 8,
    japanese: "父",
    hiragana: "ちち",
    romaji: "chichi",
    vietnamese: "bố (của mình)",
    type: "Danh từ",
    topic: "Gia đình",
    example: {
      japanese: "父は会社員です。",
      vietnamese: "Bố tôi là nhân viên công ty.",
    },
  },
  {
    id: 9,
    japanese: "電話",
    hiragana: "でんわ",
    romaji: "denwa",
    vietnamese: "điện thoại; cuộc gọi điện thoại",
    type: "Danh từ",
    topic: "Đồ vật",
    example: {
      japanese: "電話をします。",
      vietnamese: "Tôi gọi điện thoại.",
    },
  },
]

export const grammarFilters = ["Tất cả", "Chưa học", "Đang học", "Đã hoàn thành"]

export const grammarData: GrammarItem[] = [
  {
    id: 1,
    pattern: "N は N です",
    meaning: "N là N",
    structure: "Danh từ 1 + は + Danh từ 2 + です",
    example: {
      japanese: "私は学生です。",
      vietnamese: "Tôi là sinh viên.",
    },
    usageNote: "Dùng để giới thiệu bản thân hoặc nói về đặc điểm của ai/cái gì đó.",
    difficulty: "Dễ",
    status: "Đã hoàn thành",
  },
  {
    id: 2,
    pattern: "N じゃありません",
    meaning: "Không phải là N",
    structure: "Danh từ + じゃありません / ではありません",
    example: {
      japanese: "私は先生じゃありません。",
      vietnamese: "Tôi không phải là giáo viên.",
    },
    usageNote: "Thể phủ định của です. じゃありません là cách nói thông thường, ではありません lịch sự hơn.",
    difficulty: "Dễ",
    status: "Đang học",
  },
  {
    id: 3,
    pattern: "これ / それ / あれ",
    meaning: "Cái này / Cái đó / Cái kia",
    structure: "これ/それ/あれ + は + N + です",
    example: {
      japanese: "これは本です。",
      vietnamese: "Cái này là sách.",
    },
    usageNote: "これ: gần người nói, それ: gần người nghe, あれ: xa cả hai người.",
    difficulty: "Dễ",
    status: "Đã hoàn thành",
  },
  {
    id: 4,
    pattern: "〜ます / 〜ません",
    meaning: "Thể lịch sự khẳng định/phủ định của động từ",
    structure: "Động từ thể ます / Động từ thể ません",
    example: {
      japanese: "毎日日本語を勉強します。",
      vietnamese: "Hằng ngày tôi học tiếng Nhật.",
    },
    usageNote: "Thể ます dùng trong giao tiếp lịch sự. ません là thể phủ định.",
    difficulty: "Trung bình",
    status: "Đang học",
  },
  {
    id: 5,
    pattern: "N を V ます",
    meaning: "Làm gì đó với đối tượng N",
    structure: "Danh từ + を + Động từ thể ます",
    example: {
      japanese: "本を読みます。",
      vietnamese: "Tôi đọc sách.",
    },
    usageNote: "Trợ từ を đánh dấu tân ngữ trực tiếp của động từ.",
    difficulty: "Trung bình",
    status: "Chưa học",
  },
  {
    id: 6,
    pattern: "N に V ます",
    meaning: "Làm gì đó tại địa điểm/thời điểm N",
    structure: "Danh từ địa điểm/thời gian + に + Động từ",
    example: {
      japanese: "7時に起きます。",
      vietnamese: "Tôi dậy lúc 7 giờ.",
    },
    usageNote: "Trợ từ に dùng để chỉ thời điểm cụ thể hoặc điểm đến.",
    difficulty: "Trung bình",
    status: "Chưa học",
  },
  {
    id: 7,
    pattern: "どこ / なに / だれ",
    meaning: "Ở đâu / Cái gì / Ai",
    structure: "Từ nghi vấn + ですか",
    example: {
      japanese: "これは何ですか。",
      vietnamese: "Đây là cái gì?",
    },
    usageNote: "Các từ nghi vấn cơ bản trong tiếng Nhật.",
    difficulty: "Dễ",
    status: "Đã hoàn thành",
  },
  {
    id: 8,
    pattern: "〜ましょう",
    meaning: "Hãy cùng làm...",
    structure: "Động từ bỏ ます + ましょう",
    example: {
      japanese: "一緒に食べましょう。",
      vietnamese: "Hãy cùng ăn nào.",
    },
    usageNote: "Dùng để rủ rê, đề nghị cùng làm gì đó.",
    difficulty: "Trung bình",
    status: "Chưa học",
  },
]

export const quizQuestions: QuizQuestionItem[] = [
  {
    id: 1,
    question: '"学生" nghĩa là gì?',
    type: "vocabulary",
    difficulty: "easy",
    topic: "Trường học",
    answers: [
      { id: "a", text: "Giáo viên" },
      { id: "b", text: "Sinh viên" },
      { id: "c", text: "Sách" },
      { id: "d", text: "Nhật Bản" },
    ],
    correctAnswer: "b",
    explanation: "学生 (がくせい / gakusei) có nghĩa là sinh viên.",
  },
  {
    id: 2,
    question: 'Chọn cách đọc đúng của "先生"',
    type: "vocabulary",
    difficulty: "easy",
    topic: "Trường học",
    answers: [
      { id: "a", text: "sakisei" },
      { id: "b", text: "sensei" },
      { id: "c", text: "seisei" },
      { id: "d", text: "sensou" },
    ],
    correctAnswer: "b",
    explanation: "先生 đọc là せんせい (sensei), có nghĩa là giáo viên.",
  },
  {
    id: 3,
    question: 'Điền vào chỗ trống: "私___学生です。"',
    type: "grammar",
    difficulty: "easy",
    topic: "Trợ từ",
    answers: [
      { id: "a", text: "を" },
      { id: "b", text: "が" },
      { id: "c", text: "は" },
      { id: "d", text: "に" },
    ],
    correctAnswer: "c",
    explanation: 'Trợ từ は dùng để đánh dấu chủ đề của câu. "私は学生です" nghĩa là "Tôi là sinh viên".',
  },
  {
    id: 4,
    question: '"水" nghĩa là gì?',
    type: "vocabulary",
    difficulty: "easy",
    topic: "Đồ vật",
    answers: [
      { id: "a", text: "Lửa" },
      { id: "b", text: "Đất" },
      { id: "c", text: "Gió" },
      { id: "d", text: "Nước" },
    ],
    correctAnswer: "d",
    explanation: "水 (みず / mizu) có nghĩa là nước.",
  },
  {
    id: 5,
    question: 'Câu nào đúng để nói "Đây là sách"?',
    type: "grammar",
    difficulty: "easy",
    topic: "Chỉ định từ",
    answers: [
      { id: "a", text: "これは本です。" },
      { id: "b", text: "それは本です。" },
      { id: "c", text: "あれは本です。" },
      { id: "d", text: "どれは本です。" },
    ],
    correctAnswer: "a",
    explanation: 'これは dùng cho vật ở gần người nói. "これは本です" = "Cái này là sách".',
  },
]
