"use client"

import { useEffect, useState } from "react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next"

export type Locale = "vi" | "en" | "ja"

const storageKey = "nihongo_locale"
const originalTextNodes = new WeakMap<Text, string>()
const originalElementAttributes = new WeakMap<Element, Record<string, string>>()

const dictionaries = {
  vi: {
    "language.label": "Ngôn ngữ",
    "language.vi": "Tiếng Việt",
    "language.en": "English",
    "language.ja": "日本語",
    "auth.login": "Đăng nhập",
    "auth.register": "Đăng ký",
    "auth.logout": "Đăng xuất",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.confirmPassword": "Xác nhận mật khẩu",
    "auth.fullName": "Họ và tên",
    "auth.loginTitle": "Đăng nhập",
    "auth.loginDescription": "Tiếp tục học với tài khoản đã đăng ký.",
    "auth.loginButton": "Đăng nhập",
    "auth.loginLoading": "Đang đăng nhập...",
    "auth.noAccount": "Chưa có tài khoản?",
    "auth.hasAccount": "Đã có tài khoản?",
    "auth.registerTitle": "Đăng ký",
    "auth.registerDescription": "Tạo tài khoản người học mới.",
    "auth.registerButton": "Tạo tài khoản",
    "auth.registerLoading": "Đang tạo tài khoản...",
    "auth.showPassword": "Hiện mật khẩu",
    "auth.hidePassword": "Ẩn mật khẩu",
    "auth.passwordPlaceholder": "Nhập mật khẩu",
    "auth.newPasswordPlaceholder": "Ít nhất 8 ký tự",
    "auth.confirmPasswordPlaceholder": "Nhập lại mật khẩu",
    "auth.namePlaceholder": "Nguyễn Văn A",
    "auth.emailPlaceholder": "ban@example.com",
    "auth.passwordCheckLength": "Ít nhất 8 ký tự",
    "auth.passwordCheckLetter": "Có chữ cái",
    "auth.passwordCheckNumber": "Có chữ số",
    "auth.passwordCheckMatch": "Xác nhận khớp",
    "auth.invalidRegisterForm": "Vui lòng kiểm tra lại họ tên, email và mật khẩu.",
    "auth.loginFallbackError": "Không thể đăng nhập.",
    "auth.registerFallbackError": "Không thể tạo tài khoản.",
    "auth.loginSideTitle": "Học N5 với dữ liệu cá nhân được lưu trong PostgreSQL.",
    "auth.loginSideDescription": "Tài khoản, phiên đăng nhập, tiến độ học, quiz và lịch sử hoạt động được gắn với từng người dùng.",
    "auth.sessionSecurity": "Session bảo mật",
    "auth.sessionSecurityDesc": "Cookie httpOnly và token hash trong database.",
    "auth.privateProgress": "Tiến độ riêng",
    "auth.privateProgressDesc": "Dữ liệu học tập được tách theo tài khoản.",
    "auth.ragChatbot": "Chatbot theo nội dung hệ thống",
    "auth.ragChatbotDesc": "Câu hỏi được xử lý qua API đã yêu cầu đăng nhập.",
    "auth.registerSideKicker": "Tạo tài khoản học N5",
    "auth.registerSideTitle": "Mỗi người học có dữ liệu và tiến độ riêng.",
    "auth.registerSideDescription": "Sau khi đăng ký, hệ thống tạo user trong PostgreSQL, hash mật khẩu và mở phiên đăng nhập tự động.",
    "auth.realAccount": "Tài khoản thật",
    "auth.hashedPassword": "Mật khẩu hash",
    "auth.privateOnboarding": "Onboarding riêng",
    "nav.dashboard": "Dashboard",
    "nav.onboarding": "Hồ sơ học",
    "nav.kana": "Bảng Kana",
    "nav.reading": "B\u00e0i \u0111\u1ecdc song ng\u1eef",
    "nav.vocabulary": "Từ vựng",
    "nav.grammar": "Ngữ pháp",
    "nav.quiz": "Quiz",
    "nav.chatbot": "Chatbot AI",
    "nav.learningPath": "Lộ trình học",
    "nav.history": "Lịch sử học tập",
    "nav.profile": "Hồ sơ",
    "nav.admin": "Quản trị",
    "nav.collapse": "Thu gọn",
    "header.search": "Tìm kiếm từ vựng, ngữ pháp...",
    "header.streak": "ngày streak",
    "header.admin": "Admin",
    "header.learner": "Người học",
    "header.notifications": "Thông báo",
    "header.account": "Tài khoản của tôi",
    "header.profile": "Hồ sơ cá nhân",
    "header.history": "Lịch sử học tập",
    "header.learningPath": "Lộ trình học",
    "landing.features": "Chức năng",
    "landing.aiRecommendation": "AI gợi ý",
    "landing.admin": "Quản trị",
    "landing.chatbot": "Chatbot",
    "landing.badge": "Đồ án học tiếng Nhật N5 tích hợp AI",
    "landing.heroTitle": "Ứng dụng học tiếng Nhật N5 với AI và lộ trình cá nhân hóa",
    "landing.heroDescription": "Nền tảng hỗ trợ học từ vựng, ngữ pháp, quiz, lịch sử học tập, quản trị nội dung, chatbot RAG và hệ khuyến nghị dựa trên hành vi người dùng.",
    "landing.startLearning": "Vào học ngay",
    "landing.viewFeatures": "Xem chức năng",
    "landing.preview": "Bản xem trước hệ thống",
    "landing.todayProgress": "Tiến độ hôm nay",
    "landing.newWords": "+12 từ mới",
    "landing.goalProgress": "68% mục tiêu N5",
    "landing.lastQuiz": "Quiz gần nhất: 84%",
    "landing.featuresKicker": "Chức năng chính",
    "landing.featuresTitle": "Một hệ thống học N5 hoàn chỉnh để demo đồ án",
    "landing.featuresDescription": "Các module được kết nối thành một luồng: nhập nội dung, học, làm quiz, ghi lịch sử và nhận gợi ý.",
    "chatbot.title": "Kami",
    "chatbot.description": "Kami dùng RAG, tiến độ học và công cụ dữ liệu để tư vấn tiếng Nhật theo ngữ cảnh của bạn.",
    "chatbot.welcome.title": "Xin chào, mình là Kami.",
    "chatbot.welcome.description": "Mình có thể tra cứu từ vựng, ngữ pháp, quiz, bài đọc, tiến độ và mục đã lưu để trả lời kèm nguồn. Nếu bạn muốn kiểm tra trình độ, mình sẽ tạo quiz chẩn đoán thay vì chỉ gợi ý tài liệu.",
    "chatbot.now": "Bây giờ",
    "chatbot.suggestion.word": "学生 nghĩa là gì? Cho ví dụ dễ nhớ.",
    "chatbot.suggestion.pattern": "Giải thích mẫu câu N は N です cho người mới học.",
    "chatbot.suggestion.kosoado": "Phân biệt これ, それ và あれ.",
    "chatbot.suggestion.particles": "Tôi hay sai trợ từ は và が, nên ôn gì trước?",
    "chatbot.suggestion.plan": "Tôi muốn thi N4 vào tháng 7 nhưng mới xong N5, phải làm sao?",
    "chatbot.history.title": "Lịch sử chat",
    "chatbot.history.loading": "Đang tải lịch sử...",
    "chatbot.history.empty": "Chưa có hội thoại nào.",
    "chatbot.history.loadError": "Không tải được lịch sử chat.",
    "chatbot.history.deleteOneConfirm": "Xóa hội thoại này?",
    "chatbot.history.deleteAllConfirm": "Xóa toàn bộ lịch sử chat?",
    "chatbot.history.deleteAll": "Xóa toàn bộ",
    "chatbot.new": "Chat mới",
    "chatbot.newStarted": "Đã bắt đầu chat mới.",
    "chatbot.activeSource": "Đang hỏi về",
    "chatbot.activeArticle": "Đang hỏi về bài",
    "chatbot.clearSource": "Bỏ nguồn này",
    "chatbot.sourceCleared": "Đã bỏ nguồn đang active.",
    "chatbot.sources.title": "Nguồn tham khảo",
    "chatbot.sources.recent": "Nguồn gần nhất",
    "chatbot.sources.empty": "Chưa có nguồn nào. Hãy gửi một câu hỏi để hệ thống truy xuất dữ liệu.",
    "chatbot.source.grammar": "Ngữ pháp",
    "chatbot.source.quiz": "Quiz",
    "chatbot.source.news": "Bài đọc",
    "chatbot.source.vocabulary": "Từ vựng",
    "chatbot.agent.loading": "Kami đang xem nguồn RAG, tiến độ học và công cụ phù hợp...",
    "chatbot.agent.toolsLoading": "Kami có thể đang đọc hồ sơ, tiến độ, ngữ pháp hoặc bài đọc.",
    "chatbot.provider.label": "Nhà cung cấp",
    "chatbot.provider.fallback": "Fallback nội bộ",
    "chatbot.provider.none": "Chưa có",
    "chatbot.questionCount": "Câu hỏi hôm nay",
    "chatbot.messageUnit": "tin nhắn",
    "chatbot.stop": "Dừng",
    "chatbot.answering": "Đang trả lời...",
    "chatbot.streamEmpty": "Mình đã tìm được nguồn nhưng model chưa tạo câu trả lời hoàn chỉnh. Hãy gửi lại câu hỏi ngắn hơn hoặc thử tải lại trang.",
    "chatbot.stopped": "Đã dừng câu trả lời theo yêu cầu của bạn.",
    "chatbot.errorWithMessage": "Mình chưa thể xử lý câu hỏi lúc này. Lỗi:",
    "chatbot.errorFallback": "Mình chưa thể xử lý câu hỏi lúc này. Hãy thử lại sau hoặc hỏi ngắn hơn.",
    "chatbot.fallbackNote": "Ghi chú: câu trả lời này đang dùng fallback vì OpenRouter chưa có phản hồi hoặc chưa cấu hình key.",
    "chatbot.saveSourceMissing": "Chưa có nguồn từ vựng/ngữ pháp phù hợp để lưu.",
    "chatbot.saveSourceNote": "Được lưu từ Kami.",
    "chatbot.saveSourcePrefix": "Đã lưu",
    "chatbot.saveSourceSuffix": "vào ôn tập.",
    "chatbot.createQuizConfirm": "Tạo mini quiz 5 câu dựa trên câu trả lời này?",
    "chatbot.quizSourceFallback": "nội dung vừa trao đổi",
    "chatbot.createQuizPromptPrefix": "Hãy tạo mini quiz 5 câu trắc nghiệm dựa trên:",
    "chatbot.createQuizPromptSuffix": "Có đáp án và giải thích ngắn.",
    "chatbot.logActivityConfirm": "Ghi cuộc trao đổi này vào lịch sử hoạt động học?",
    "chatbot.activityResultLearned": "Đã học",
    "chatbot.activitySaved": "Đã ghi hoạt động học vào lịch sử.",
    "chatbot.quizSavePrefix": "Đã lưu kết quả quiz:",
    "chatbot.correctUnit": "câu đúng",
    "chatbot.quiz.correct": "Đúng",
    "chatbot.quiz.wrongPrefix": "Sai. Đáp án đúng là",
    "chatbot.quiz.selectedPrefix": "Đã chọn",
    "chatbot.quiz.resultPrefix": "Kết quả:",
    "chatbot.quiz.selectedCountPrefix": "Đã chọn",
    "chatbot.quiz.missingAnswerKey": "Quiz này chưa có đáp án đúng để chấm. Hãy tạo lại quiz.",
    "chatbot.quiz.saving": "Đang lưu lịch sử...",
    "chatbot.quiz.saved": "Đã lưu lịch sử.",
    "chatbot.quiz.failed": "Chưa lưu được lịch sử.",
    "chatbot.quiz.retry": "Làm lại",
    "chatbot.quiz.submit": "Nộp bài",
    "chatbot.action.listen": "Nghe",
    "chatbot.action.saveSource": "Lưu nguồn",
    "chatbot.action.createQuiz": "Tạo quiz",
    "chatbot.action.logActivity": "Ghi hoạt động",
    "chatbot.input.placeholder": "Nhập câu hỏi của bạn... Enter để gửi, Shift+Enter để xuống dòng.",
  },
  en: {
    "language.label": "Language",
    "language.vi": "Tiếng Việt",
    "language.en": "English",
    "language.ja": "日本語",
    "auth.login": "Log in",
    "auth.register": "Sign up",
    "auth.logout": "Log out",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.fullName": "Full name",
    "auth.loginTitle": "Log in",
    "auth.loginDescription": "Continue learning with your registered account.",
    "auth.loginButton": "Log in",
    "auth.loginLoading": "Logging in...",
    "auth.noAccount": "No account yet?",
    "auth.hasAccount": "Already have an account?",
    "auth.registerTitle": "Sign up",
    "auth.registerDescription": "Create a new learner account.",
    "auth.registerButton": "Create account",
    "auth.registerLoading": "Creating account...",
    "auth.showPassword": "Show password",
    "auth.hidePassword": "Hide password",
    "auth.passwordPlaceholder": "Enter password",
    "auth.newPasswordPlaceholder": "At least 8 characters",
    "auth.confirmPasswordPlaceholder": "Re-enter password",
    "auth.namePlaceholder": "Nguyen Van A",
    "auth.emailPlaceholder": "you@example.com",
    "auth.passwordCheckLength": "At least 8 characters",
    "auth.passwordCheckLetter": "Contains a letter",
    "auth.passwordCheckNumber": "Contains a number",
    "auth.passwordCheckMatch": "Confirmation matches",
    "auth.invalidRegisterForm": "Please check your name, email, and password.",
    "auth.loginFallbackError": "Unable to log in.",
    "auth.registerFallbackError": "Unable to create account.",
    "auth.loginSideTitle": "Learn N5 with personal data stored in PostgreSQL.",
    "auth.loginSideDescription": "Accounts, sessions, progress, quizzes, and activity history are tied to each user.",
    "auth.sessionSecurity": "Secure session",
    "auth.sessionSecurityDesc": "httpOnly cookie and hashed token in the database.",
    "auth.privateProgress": "Private progress",
    "auth.privateProgressDesc": "Learning data is separated by account.",
    "auth.ragChatbot": "Content-aware chatbot",
    "auth.ragChatbotDesc": "Questions are handled through authenticated APIs.",
    "auth.registerSideKicker": "Create an N5 study account",
    "auth.registerSideTitle": "Each learner has separate data and progress.",
    "auth.registerSideDescription": "After registration, the system creates a PostgreSQL user, hashes the password, and opens a session automatically.",
    "auth.realAccount": "Real account",
    "auth.hashedPassword": "Hashed password",
    "auth.privateOnboarding": "Private onboarding",
    "nav.dashboard": "Dashboard",
    "nav.onboarding": "Study profile",
    "nav.kana": "Kana chart",
    "nav.reading": "Bilingual reading",
    "nav.vocabulary": "Vocabulary",
    "nav.grammar": "Grammar",
    "nav.quiz": "Quiz",
    "nav.chatbot": "Kami",
    "nav.learningPath": "Learning path",
    "nav.history": "Study history",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "nav.collapse": "Collapse",
    "header.search": "Search vocabulary, grammar...",
    "header.streak": "day streak",
    "header.admin": "Admin",
    "header.learner": "Learner",
    "header.notifications": "Notifications",
    "header.account": "My account",
    "header.profile": "Profile",
    "header.history": "Study history",
    "header.learningPath": "Learning path",
    "landing.features": "Features",
    "landing.aiRecommendation": "AI recommendations",
    "landing.admin": "Admin",
    "landing.chatbot": "Kami",
    "landing.badge": "AI-powered Japanese N5 study project",
    "landing.heroTitle": "Learn Japanese N5 with AI and a personalized path",
    "landing.heroDescription": "A platform for vocabulary, grammar, quizzes, learning history, content management, RAG chatbot, and behavior-based recommendations.",
    "landing.startLearning": "Start learning",
    "landing.viewFeatures": "View features",
    "landing.preview": "System preview",
    "landing.todayProgress": "Today's progress",
    "landing.newWords": "+12 new words",
    "landing.goalProgress": "68% of N5 goal",
    "landing.lastQuiz": "Latest quiz: 84%",
    "landing.featuresKicker": "Core features",
    "landing.featuresTitle": "A complete N5 study system for the project demo",
    "landing.featuresDescription": "Modules are connected into one flow: manage content, study, take quizzes, record history, and receive recommendations.",
    "chatbot.title": "Kami",
    "chatbot.description": "Kami uses RAG, learning progress, and data tools to support Japanese study in context.",
    "chatbot.welcome.title": "Hello, I am Kami.",
    "chatbot.welcome.description": "I can search vocabulary, grammar, quizzes, readings, progress, and saved items to answer with sources. If you ask for a level check, I will create a diagnostic quiz instead of only suggesting materials.",
    "chatbot.now": "Now",
    "chatbot.suggestion.word": "What does 学生 mean? Give me an easy example.",
    "chatbot.suggestion.pattern": "Explain the pattern N は N です for beginners.",
    "chatbot.suggestion.kosoado": "Explain the difference between これ, それ, and あれ.",
    "chatbot.suggestion.particles": "I often confuse は and が. What should I review first?",
    "chatbot.suggestion.plan": "I want to take N4 in July but just finished N5. What should I do?",
    "chatbot.history.title": "Chat history",
    "chatbot.history.loading": "Loading history...",
    "chatbot.history.empty": "No conversations yet.",
    "chatbot.history.loadError": "Unable to load chat history.",
    "chatbot.history.deleteOneConfirm": "Delete this conversation?",
    "chatbot.history.deleteAllConfirm": "Delete all chat history?",
    "chatbot.history.deleteAll": "Delete all",
    "chatbot.new": "New chat",
    "chatbot.newStarted": "Started a new chat.",
    "chatbot.activeSource": "Asking about",
    "chatbot.activeArticle": "Asking about article",
    "chatbot.clearSource": "Clear source",
    "chatbot.sourceCleared": "Cleared the active source.",
    "chatbot.sources.title": "References",
    "chatbot.sources.recent": "Recent sources",
    "chatbot.sources.empty": "No sources yet. Send a question to retrieve data.",
    "chatbot.source.grammar": "Grammar",
    "chatbot.source.quiz": "Quiz",
    "chatbot.source.news": "Reading",
    "chatbot.source.vocabulary": "Vocabulary",
    "chatbot.agent.loading": "Kami is checking RAG sources, progress, and relevant tools...",
    "chatbot.agent.toolsLoading": "Kami may be reading profile, progress, grammar, or reading data.",
    "chatbot.provider.label": "Provider",
    "chatbot.provider.fallback": "Internal fallback",
    "chatbot.provider.none": "None yet",
    "chatbot.questionCount": "Questions today",
    "chatbot.messageUnit": "messages",
    "chatbot.stop": "Stop",
    "chatbot.answering": "Answering...",
    "chatbot.streamEmpty": "I found relevant sources, but the model did not produce a complete answer. Try sending a shorter question or reloading the page.",
    "chatbot.stopped": "Stopped the answer as requested.",
    "chatbot.errorWithMessage": "I cannot process this question right now. Error:",
    "chatbot.errorFallback": "I cannot process this question right now. Please try again later or ask a shorter question.",
    "chatbot.fallbackNote": "Note: this answer is using fallback because OpenRouter has not responded or the key is not configured.",
    "chatbot.saveSourceMissing": "No suitable vocabulary/grammar source is available to save.",
    "chatbot.saveSourceNote": "Saved from Kami.",
    "chatbot.saveSourcePrefix": "Saved",
    "chatbot.saveSourceSuffix": "to review.",
    "chatbot.createQuizConfirm": "Create a 5-question mini quiz from this answer?",
    "chatbot.quizSourceFallback": "the recent conversation",
    "chatbot.createQuizPromptPrefix": "Create a 5-question multiple-choice mini quiz based on:",
    "chatbot.createQuizPromptSuffix": "Include answers and short explanations.",
    "chatbot.logActivityConfirm": "Save this conversation to learning activity history?",
    "chatbot.activityResultLearned": "Learned",
    "chatbot.activitySaved": "Saved the learning activity to history.",
    "chatbot.quizSavePrefix": "Saved quiz result:",
    "chatbot.correctUnit": "correct",
    "chatbot.quiz.correct": "Correct",
    "chatbot.quiz.wrongPrefix": "Wrong. The correct answer is",
    "chatbot.quiz.selectedPrefix": "Selected",
    "chatbot.quiz.resultPrefix": "Result:",
    "chatbot.quiz.selectedCountPrefix": "Selected",
    "chatbot.quiz.missingAnswerKey": "This quiz has no answer key yet. Please regenerate it.",
    "chatbot.quiz.saving": "Saving history...",
    "chatbot.quiz.saved": "Saved to history.",
    "chatbot.quiz.failed": "Could not save history.",
    "chatbot.quiz.retry": "Try again",
    "chatbot.quiz.submit": "Submit",
    "chatbot.action.listen": "Listen",
    "chatbot.action.saveSource": "Save source",
    "chatbot.action.createQuiz": "Create quiz",
    "chatbot.action.logActivity": "Log activity",
    "chatbot.input.placeholder": "Enter your question... Enter to send, Shift+Enter for a new line.",
  },
  ja: {
    "language.label": "言語",
    "language.vi": "Tiếng Việt",
    "language.en": "English",
    "language.ja": "日本語",
    "auth.login": "ログイン",
    "auth.register": "登録",
    "auth.logout": "ログアウト",
    "auth.email": "メール",
    "auth.password": "パスワード",
    "auth.confirmPassword": "パスワード確認",
    "auth.fullName": "氏名",
    "auth.loginTitle": "ログイン",
    "auth.loginDescription": "登録済みアカウントで学習を続けます。",
    "auth.loginButton": "ログイン",
    "auth.loginLoading": "ログイン中...",
    "auth.noAccount": "アカウントがありませんか？",
    "auth.hasAccount": "すでにアカウントがありますか？",
    "auth.registerTitle": "登録",
    "auth.registerDescription": "新しい学習者アカウントを作成します。",
    "auth.registerButton": "アカウント作成",
    "auth.registerLoading": "作成中...",
    "auth.showPassword": "パスワードを表示",
    "auth.hidePassword": "パスワードを隠す",
    "auth.passwordPlaceholder": "パスワードを入力",
    "auth.newPasswordPlaceholder": "8文字以上",
    "auth.confirmPasswordPlaceholder": "もう一度入力",
    "auth.namePlaceholder": "山田 太郎",
    "auth.emailPlaceholder": "you@example.com",
    "auth.passwordCheckLength": "8文字以上",
    "auth.passwordCheckLetter": "英字を含む",
    "auth.passwordCheckNumber": "数字を含む",
    "auth.passwordCheckMatch": "確認が一致",
    "auth.invalidRegisterForm": "氏名、メール、パスワードを確認してください。",
    "auth.loginFallbackError": "ログインできません。",
    "auth.registerFallbackError": "アカウントを作成できません。",
    "auth.loginSideTitle": "PostgreSQLに保存された個人データでN5を学習。",
    "auth.loginSideDescription": "アカウント、セッション、進捗、クイズ、活動履歴はユーザーごとに管理されます。",
    "auth.sessionSecurity": "安全なセッション",
    "auth.sessionSecurityDesc": "httpOnly CookieとDB内のハッシュ済みトークン。",
    "auth.privateProgress": "個別の進捗",
    "auth.privateProgressDesc": "学習データはアカウントごとに分離されます。",
    "auth.ragChatbot": "教材対応チャットボット",
    "auth.ragChatbotDesc": "質問は認証済みAPIで処理されます。",
    "auth.registerSideKicker": "N5学習アカウント作成",
    "auth.registerSideTitle": "学習者ごとにデータと進捗を管理。",
    "auth.registerSideDescription": "登録後、PostgreSQLにユーザーを作成し、パスワードをハッシュ化して自動的にセッションを開始します。",
    "auth.realAccount": "本番アカウント",
    "auth.hashedPassword": "ハッシュ化パスワード",
    "auth.privateOnboarding": "個別オンボーディング",
    "nav.dashboard": "ダッシュボード",
    "nav.onboarding": "学習プロフィール",
    "nav.kana": "かな表",
    "nav.reading": "\u30d0\u30a4\u30ea\u30f3\u30ac\u30eb\u8aad\u89e3",
    "nav.vocabulary": "語彙",
    "nav.grammar": "文法",
    "nav.quiz": "クイズ",
    "nav.chatbot": "Kami",
    "nav.learningPath": "学習ルート",
    "nav.history": "学習履歴",
    "nav.profile": "プロフィール",
    "nav.admin": "管理",
    "nav.collapse": "折りたたむ",
    "header.search": "語彙・文法を検索...",
    "header.streak": "日連続",
    "header.admin": "管理者",
    "header.learner": "学習者",
    "header.notifications": "通知",
    "header.account": "マイアカウント",
    "header.profile": "プロフィール",
    "header.history": "学習履歴",
    "header.learningPath": "学習ルート",
    "landing.features": "機能",
    "landing.aiRecommendation": "AI提案",
    "landing.admin": "管理",
    "landing.chatbot": "Kami",
    "landing.badge": "AI統合日本語N5学習プロジェクト",
    "landing.heroTitle": "AIと個別ルートで日本語N5を学習",
    "landing.heroDescription": "語彙、文法、クイズ、学習履歴、コンテンツ管理、RAGチャットボット、行動ベース推薦を備えた学習プラットフォーム。",
    "landing.startLearning": "学習を始める",
    "landing.viewFeatures": "機能を見る",
    "landing.preview": "システムプレビュー",
    "landing.todayProgress": "今日の進捗",
    "landing.newWords": "+12 新しい語彙",
    "landing.goalProgress": "N5目標の68%",
    "landing.lastQuiz": "最新クイズ: 84%",
    "landing.featuresKicker": "主な機能",
    "landing.featuresTitle": "卒業制作デモ向けのN5学習システム",
    "landing.featuresDescription": "コンテンツ管理、学習、クイズ、履歴記録、推薦を1つの流れで接続します。",
    "chatbot.title": "Kami",
    "chatbot.description": "KamiはRAG、学習進捗、データツールを使って日本語学習を文脈に合わせてサポートします。",
    "chatbot.welcome.title": "こんにちは。Kamiです。",
    "chatbot.welcome.description": "語彙、文法、クイズ、読解、学習進捗、保存項目を検索して、ソース付きで回答できます。レベルチェックを頼まれた場合は、教材一覧だけでなく診断クイズを作成します。",
    "chatbot.now": "今",
    "chatbot.suggestion.word": "学生の意味は？覚えやすい例もください。",
    "chatbot.suggestion.pattern": "初心者向けに N は N です の文型を説明してください。",
    "chatbot.suggestion.kosoado": "これ・それ・あれの違いを説明してください。",
    "chatbot.suggestion.particles": "は と が をよく間違えます。何から復習すればいいですか？",
    "chatbot.suggestion.plan": "N5を終えたばかりですが、7月にN4を受けたいです。どうすればいいですか？",
    "chatbot.history.title": "チャット履歴",
    "chatbot.history.loading": "履歴を読み込み中...",
    "chatbot.history.empty": "まだ会話がありません。",
    "chatbot.history.loadError": "チャット履歴を読み込めません。",
    "chatbot.history.deleteOneConfirm": "この会話を削除しますか？",
    "chatbot.history.deleteAllConfirm": "すべてのチャット履歴を削除しますか？",
    "chatbot.history.deleteAll": "すべて削除",
    "chatbot.new": "新しいチャット",
    "chatbot.newStarted": "新しいチャットを開始しました。",
    "chatbot.activeSource": "質問中",
    "chatbot.activeArticle": "記事について質問中",
    "chatbot.clearSource": "ソース解除",
    "chatbot.sourceCleared": "現在のソースを解除しました。",
    "chatbot.sources.title": "参照ソース",
    "chatbot.sources.recent": "最近のソース",
    "chatbot.sources.empty": "まだ参照ソースはありません。質問を送るとデータを検索します。",
    "chatbot.source.grammar": "文法",
    "chatbot.source.quiz": "クイズ",
    "chatbot.source.news": "読解",
    "chatbot.source.vocabulary": "語彙",
    "chatbot.agent.loading": "KamiがRAG・学習進捗・関連ツールを確認中...",
    "chatbot.agent.toolsLoading": "Kamiがプロフィール・進捗・文法・読解データを確認中です。",
    "chatbot.provider.label": "プロバイダー",
    "chatbot.provider.fallback": "内部フォールバック",
    "chatbot.provider.none": "まだありません",
    "chatbot.questionCount": "今日の質問",
    "chatbot.messageUnit": "件のメッセージ",
    "chatbot.stop": "停止",
    "chatbot.answering": "回答中...",
    "chatbot.streamEmpty": "関連ソースは見つかりましたが、モデルが完全な回答を生成できませんでした。短い質問でもう一度送るか、ページを再読み込みしてください。",
    "chatbot.stopped": "リクエストにより回答を停止しました。",
    "chatbot.errorWithMessage": "現在この質問を処理できません。エラー:",
    "chatbot.errorFallback": "現在この質問を処理できません。後でもう一度試すか、短く質問してください。",
    "chatbot.fallbackNote": "注: OpenRouterの応答がない、またはキー未設定のため、この回答はフォールバックを使用しています。",
    "chatbot.saveSourceMissing": "保存できる語彙/文法ソースがありません。",
    "chatbot.saveSourceNote": "Kamiから保存しました。",
    "chatbot.saveSourcePrefix": "保存しました:",
    "chatbot.saveSourceSuffix": "復習に追加しました。",
    "chatbot.createQuizConfirm": "この回答から5問のミニクイズを作成しますか？",
    "chatbot.quizSourceFallback": "直近の会話内容",
    "chatbot.createQuizPromptPrefix": "次の内容に基づいて5問の選択式ミニクイズを作成してください:",
    "chatbot.createQuizPromptSuffix": "答えと短い説明を含めてください。",
    "chatbot.logActivityConfirm": "この会話を学習活動履歴に保存しますか？",
    "chatbot.activityResultLearned": "学習済み",
    "chatbot.activitySaved": "学習活動を履歴に保存しました。",
    "chatbot.quizSavePrefix": "クイズ結果を保存しました:",
    "chatbot.correctUnit": "正解",
    "chatbot.quiz.correct": "正解",
    "chatbot.quiz.wrongPrefix": "不正解。正しい答えは",
    "chatbot.quiz.selectedPrefix": "選択済み",
    "chatbot.quiz.resultPrefix": "結果:",
    "chatbot.quiz.selectedCountPrefix": "選択済み",
    "chatbot.quiz.missingAnswerKey": "このクイズには採点用の正解データがありません。作り直してください。",
    "chatbot.quiz.saving": "履歴を保存中...",
    "chatbot.quiz.saved": "履歴に保存しました。",
    "chatbot.quiz.failed": "履歴を保存できませんでした。",
    "chatbot.quiz.retry": "やり直す",
    "chatbot.quiz.submit": "提出",
    "chatbot.action.listen": "聞く",
    "chatbot.action.saveSource": "ソース保存",
    "chatbot.action.createQuiz": "クイズ作成",
    "chatbot.action.logActivity": "活動を記録",
    "chatbot.input.placeholder": "質問を入力... Enterで送信、Shift+Enterで改行。",
  },
} as const

type TranslationKey = keyof typeof dictionaries.vi

const globalTextTranslations: Record<string, Partial<Record<Locale, string>>> = {
  "Dashboard": { en: "Dashboard", ja: "ダッシュボード" },
  "Hồ sơ học": { en: "Study profile", ja: "学習プロフィール" },
  "Từ vựng": { en: "Vocabulary", ja: "語彙" },
  "Ngữ pháp": { en: "Grammar", ja: "文法" },
  "Quiz": { en: "Quiz", ja: "クイズ" },
  "Lộ trình học": { en: "Learning path", ja: "学習ルート" },
  "Lịch sử học tập": { en: "Study history", ja: "学習履歴" },
  "Hồ sơ": { en: "Profile", ja: "プロフィール" },
  "Quản trị": { en: "Admin", ja: "管理" },
  "Đăng nhập": { en: "Log in", ja: "ログイン" },
  "Đăng ký": { en: "Sign up", ja: "登録" },
  "Đăng xuất": { en: "Log out", ja: "ログアウト" },
  "Tạo tài khoản": { en: "Create account", ja: "アカウント作成" },
  "Email": { en: "Email", ja: "メール" },
  "Mật khẩu": { en: "Password", ja: "パスワード" },
  "Họ và tên": { en: "Full name", ja: "氏名" },
  "Xác nhận mật khẩu": { en: "Confirm password", ja: "パスワード確認" },
  "Hủy": { en: "Cancel", ja: "キャンセル" },
  "Lưu": { en: "Save", ja: "保存" },
  "Đang lưu...": { en: "Saving...", ja: "保存中..." },
  "Thêm": { en: "Add", ja: "追加" },
  "Sửa": { en: "Edit", ja: "編集" },
  "Xem": { en: "View", ja: "表示" },
  "Xóa": { en: "Delete", ja: "削除" },
  "Tất cả": { en: "All", ja: "すべて" },
  "Dễ": { en: "Easy", ja: "易しい" },
  "Trung bình": { en: "Medium", ja: "普通" },
  "Khó": { en: "Hard", ja: "難しい" },
  "Chưa học": { en: "Not started", ja: "未学習" },
  "Đang học": { en: "In progress", ja: "学習中" },
  "Đã hoàn thành": { en: "Completed", ja: "完了" },
  "Từ vựng N5": { en: "N5 Vocabulary", ja: "N5語彙" },
  "Ngữ pháp N5": { en: "N5 Grammar", ja: "N5文法" },
  "Quiz N5": { en: "N5 Quiz", ja: "N5クイズ" },
  "Học và ôn tập từ vựng tiếng Nhật N5": {
    en: "Learn and review N5 Japanese vocabulary",
    ja: "日本語N5の語彙を学習・復習します",
  },
  "Học các mẫu ngữ pháp tiếng Nhật N5": {
    en: "Learn N5 Japanese grammar patterns",
    ja: "日本語N5の文法パターンを学習します",
  },
  "Kiểm tra kiến thức tiếng Nhật của bạn": {
    en: "Check your Japanese knowledge",
    ja: "日本語の知識を確認します",
  },
  "Tìm từ vựng...": { en: "Search vocabulary...", ja: "語彙を検索..." },
  "Không tìm thấy từ vựng": { en: "No vocabulary found", ja: "語彙が見つかりません" },
  "Thử tìm kiếm với từ khóa khác": {
    en: "Try another keyword",
    ja: "別のキーワードで検索してください",
  },
  "Không có ngữ pháp nào": { en: "No grammar items", ja: "文法項目がありません" },
  "Chọn bộ lọc khác để xem thêm": {
    en: "Choose another filter to see more",
    ja: "別のフィルターを選択してください",
  },
  "Thống kê từ vựng": { en: "Vocabulary stats", ja: "語彙統計" },
  "Tổng số từ": { en: "Total words", ja: "総語数" },
  "Đã học": { en: "Learned", ja: "学習済み" },
  "Tiến độ": { en: "Progress", ja: "進捗" },
  "Luyện tập nhanh": { en: "Quick practice", ja: "クイック練習" },
  "Học từ mới": { en: "Learn new words", ja: "新しい語彙を学習" },
  "Thiết lập bài kiểm tra": { en: "Quiz setup", ja: "クイズ設定" },
  "Chọn loại quiz và số lượng câu hỏi": {
    en: "Choose quiz type and question count",
    ja: "クイズ種類と問題数を選択します",
  },
  "Loại quiz": { en: "Quiz type", ja: "クイズ種類" },
  "Tổng hợp": { en: "Mixed", ja: "総合" },
  "Số câu hỏi": { en: "Question count", ja: "問題数" },
  "Độ khó": { en: "Difficulty", ja: "難易度" },
  "Bắt đầu làm quiz": { en: "Start quiz", ja: "クイズを開始" },
  "Đang tải câu hỏi từ PostgreSQL...": {
    en: "Loading questions from PostgreSQL...",
    ja: "PostgreSQLから問題を読み込み中...",
  },
  "Chưa có câu hỏi phù hợp với lựa chọn này.": {
    en: "No questions match this selection.",
    ja: "この条件に合う問題はありません。",
  },
  "Kết quả": { en: "Result", ja: "結果" },
  "Chi tiết câu trả lời": { en: "Answer details", ja: "回答詳細" },
  "Về trang quiz": { en: "Back to quiz", ja: "クイズへ戻る" },
  "Làm lại": { en: "Retry", ja: "もう一度" },
  "Chatbot AI": { en: "AI Chatbot", ja: "AIチャット" },
    "Hỏi đáp tiếng Nhật N5 với RAG và OpenRouter": {
    en: "Ask N5 Japanese questions with RAG and OpenRouter",
    ja: "RAGとOpenRouterでN5日本語の質問に回答します",
  },
  "Câu hỏi gợi ý:": { en: "Suggested questions:", ja: "おすすめ質問:" },
  "Nhập câu hỏi của bạn...": { en: "Enter your question...", ja: "質問を入力..." },
  "Nguồn tham khảo": { en: "References", ja: "参照元" },
  "RAG truy xuất các nguồn sau để tạo câu trả lời:": {
    en: "RAG retrieved these sources to generate the answer:",
    ja: "RAGは回答生成のために以下の参照元を取得しました:",
  },
  "Thống kê hội thoại": { en: "Conversation stats", ja: "会話統計" },
  "Câu hỏi hôm nay": { en: "Questions today", ja: "今日の質問" },
  "Nguồn gần nhất": { en: "Latest source", ja: "最新の参照元" },
  "Chưa có": { en: "None yet", ja: "まだありません" },
  "Hồ sơ cá nhân": { en: "Personal profile", ja: "個人プロフィール" },
  "Quản lý thông tin và xem thành tích của bạn": {
    en: "Manage your information and view achievements",
    ja: "情報を管理し、実績を確認します",
  },
  "Lớp": { en: "Class", ja: "クラス" },
  "Ngành": { en: "Major", ja: "専攻" },
  "Mục tiêu": { en: "Goal", ja: "目標" },
  "Ngày bắt đầu": { en: "Start date", ja: "開始日" },
  "Tổng thời gian học": { en: "Total study time", ja: "総学習時間" },
  "Chỉnh sửa hồ sơ": { en: "Edit profile", ja: "プロフィール編集" },
  "Tiến độ học tập": { en: "Learning progress", ja: "学習進捗" },
  "Tổng quan tiến độ N5 của bạn": {
    en: "Overview of your N5 progress",
    ja: "N5進捗の概要",
  },
  "Tiến độ tổng thể": { en: "Overall progress", ja: "全体進捗" },
  "Quiz đã làm": { en: "Completed quizzes", ja: "完了したクイズ" },
  "Điểm trung bình": { en: "Average score", ja: "平均点" },
  "Streak hiện tại": { en: "Current streak", ja: "現在の連続記録" },
  "Thành tích": { en: "Achievements", ja: "実績" },
  "Các thành tích bạn đã đạt được": {
    en: "Achievements you have earned",
    ja: "獲得した実績",
  },
  "Chưa đạt": { en: "Not earned", ja: "未達成" },
  "Quản trị nội dung N5": { en: "N5 content admin", ja: "N5コンテンツ管理" },
  "Nhập JSON": { en: "Import JSON", ja: "JSONインポート" },
  "Xuất JSON": { en: "Export JSON", ja: "JSONエクスポート" },
  "Khôi phục dữ liệu mẫu": { en: "Restore sample data", ja: "サンプルデータ復元" },
  "Danh sách từ vựng": { en: "Vocabulary list", ja: "語彙リスト" },
  "Danh sách ngữ pháp": { en: "Grammar list", ja: "文法リスト" },
  "Danh sách câu hỏi quiz": { en: "Quiz question list", ja: "クイズ問題リスト" },
  "Thêm từ": { en: "Add word", ja: "語彙を追加" },
  "Thêm mẫu": { en: "Add pattern", ja: "文型を追加" },
  "Thêm câu hỏi": { en: "Add question", ja: "問題を追加" },
  "Tiếng Nhật": { en: "Japanese", ja: "日本語" },
  "Tiếng Việt": { en: "Vietnamese", ja: "ベトナム語" },
  "Loại": { en: "Type", ja: "種類" },
  "Chủ đề": { en: "Topic", ja: "トピック" },
  "Mẫu câu": { en: "Pattern", ja: "文型" },
  "Ý nghĩa": { en: "Meaning", ja: "意味" },
  "Trạng thái": { en: "Status", ja: "状態" },
  "Câu hỏi": { en: "Question", ja: "問題" },
  "Giải thích": { en: "Explanation", ja: "説明" },
  "Dịch ví dụ": { en: "Example translation", ja: "例文の訳" },
  "Ghi chú sử dụng": { en: "Usage note", ja: "使い方メモ" },
  "Đáp án đúng (a/b/c/d)": { en: "Correct answer (a/b/c/d)", ja: "正解 (a/b/c/d)" },
  "Hoạt động gần đây": { en: "Recent activity", ja: "最近の活動" },
  "Bài học đề xuất hôm nay": { en: "Recommended lessons today", ja: "今日のおすすめレッスン" },
  "Học ngay": { en: "Study now", ja: "今すぐ学習" },
  "Ôn tập ngay": { en: "Review now", ja: "今すぐ復習" },
  "Cần ôn tập": { en: "Needs review", ja: "復習が必要" },
  "Đang tải dữ liệu...": { en: "Loading data...", ja: "データを読み込み中..." },
  "Đang tải từ vựng...": { en: "Loading vocabulary...", ja: "語彙を読み込み中..." },
  "Đang tải ngữ pháp...": { en: "Loading grammar...", ja: "文法を読み込み中..." },
  "Không tải được dữ liệu mới nhất": {
    en: "Unable to load latest data",
    ja: "最新データを読み込めません",
  },
}

function isLocale(value: string | null): value is Locale {
  return value === "vi" || value === "en" || value === "ja"
}

const resources = {
  vi: { translation: dictionaries.vi },
  en: { translation: dictionaries.en },
  ja: { translation: dictionaries.ja },
}

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: "vi",
    fallbackLng: "vi",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
}

function translateStaticText(original: string, locale: Locale) {
  if (locale === "vi") return original
  return globalTextTranslations[original]?.[locale] ?? original
}

function preserveOuterWhitespace(current: string, translated: string) {
  const leading = current.match(/^\s*/)?.[0] ?? ""
  const trailing = current.match(/\s*$/)?.[0] ?? ""
  return `${leading}${translated}${trailing}`
}

function translateTextNode(node: Text, locale: Locale) {
  const raw = node.nodeValue ?? ""
  const trimmed = raw.trim()
  if (!trimmed) return
  if (node.parentElement?.closest("[data-i18n-managed]")) return

  const original = originalTextNodes.get(node) ?? trimmed
  originalTextNodes.set(node, original)

  const translated = translateStaticText(original, locale)
  node.nodeValue = preserveOuterWhitespace(raw, translated)
}

function translateElementAttributes(element: Element, locale: Locale) {
  if (element.closest("[data-i18n-managed]")) return

  const attributes = ["placeholder", "title", "aria-label"]
  const originals = originalElementAttributes.get(element) ?? {}

  attributes.forEach((attribute) => {
    const current = element.getAttribute(attribute)
    if (!current) return

    const original = originals[attribute] ?? current
    originals[attribute] = original
    element.setAttribute(attribute, translateStaticText(original, locale))
  })

  originalElementAttributes.set(element, originals)
}

function translateStaticDom(locale: Locale) {
  if (typeof document === "undefined") return

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT
        }
        if (parent.closest("[data-i18n-managed]")) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    }
  )

  let node = walker.nextNode()
  while (node) {
    translateTextNode(node as Text, locale)
    node = walker.nextNode()
  }

  document
    .querySelectorAll("[placeholder], [title], [aria-label]")
    .forEach((element) => translateElementAttributes(element, locale))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi")

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (isLocale(stored)) {
      setLocaleState(stored)
      void i18next.changeLanguage(stored)
      document.documentElement.lang = stored
    } else if (stored === "en") {
      window.localStorage.setItem(storageKey, "vi")
      void i18next.changeLanguage("vi")
      document.documentElement.lang = "vi"
    }
  }, [])

  useEffect(() => {
    const handleLanguageChanged = (nextLocale: string) => {
      if (isLocale(nextLocale)) {
        setLocaleState(nextLocale)
      }
    }

    i18next.on("languageChanged", handleLanguageChanged)
    return () => {
      i18next.off("languageChanged", handleLanguageChanged)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    translateStaticDom(locale)

    const observer = new MutationObserver(() => translateStaticDom(locale))
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    void i18next.changeLanguage(nextLocale)
    window.localStorage.setItem(storageKey, nextLocale)
    document.documentElement.lang = nextLocale
  }

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}

export function useI18n() {
  const { i18n, t: translate } = useTranslation()
  const locale = isLocale(i18n.language) ? i18n.language : "vi"

  const setLocale = (nextLocale: Locale) => {
    void i18n.changeLanguage(nextLocale)
    window.localStorage.setItem(storageKey, nextLocale)
    document.documentElement.lang = nextLocale
    translateStaticDom(nextLocale)
  }

  return {
    locale,
    setLocale,
    t: (key: TranslationKey) => translate(key),
  }
}



