import { expect, type Page, test } from "@playwright/test"

const learnerEmail = process.env.E2E_LEARNER_EMAIL ?? "learner@example.com"
const learnerPassword = process.env.E2E_LEARNER_PASSWORD ?? "password123"

async function login(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(learnerEmail)
  await page.locator("#password").fill(learnerPassword)
  await page.getByRole("button", { name: /đăng nhập|log in/i }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

test.describe("PRD defense smoke flows", () => {
  test("landing and login flow works", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText(/Nihongo AI Study/i).first()).toBeVisible()
    await page.getByRole("link", { name: /đăng nhập|log in/i }).first().click()
    await expect(page).toHaveURL(/\/login/)
    await login(page)
  })

  test("core study pages render after authentication", async ({ page }) => {
    await login(page)

    await page.goto("/vocabulary")
    await expect(page.getByText(/từ vựng|vocabulary/i).first()).toBeVisible()
    const vocabularySearch = page.getByPlaceholder(/tìm từ vựng|search vocabulary/i)
    if (await vocabularySearch.count()) {
      await vocabularySearch.first().fill("gakusei")
      await expect(page.getByText(/学生|gakusei|học sinh|sinh viên/i).first()).toBeVisible()
    }

    await page.goto("/grammar")
    await expect(page.getByText(/ngữ pháp|grammar/i).first()).toBeVisible()

    await page.goto("/dashboard")
    await expect(page.getByText(/bài học đề xuất|recommended|dashboard/i).first()).toBeVisible()

    await page.goto("/learning-path")
    await expect(page.getByText(/lộ trình|learning path/i).first()).toBeVisible()
  })

  test("quiz can be answered and submitted", async ({ page }) => {
    await login(page)
    await page.goto("/quiz")
    await expect(page.getByText(/quiz|kiểm tra/i).first()).toBeVisible()

    const mainButtons = page.locator("main").getByRole("button")
    await expect(mainButtons.last()).toBeEnabled()
    await mainButtons.last().click()

    await expect(page.getByText(/câu\s+1|question\s+1/i).first()).toBeVisible()

    for (let questionIndex = 0; questionIndex < 10; questionIndex += 1) {
      const answerButtons = page.locator("main button").filter({
        has: page.locator("span").filter({ hasText: /^[A-D]$/ }),
      })
      await expect(answerButtons.first()).toBeVisible()
      await answerButtons.first().click()

      const nextOrFinish = page.locator("main").getByRole("button", { name: /câu tiếp|hoàn thành|next|finish/i })
      await expect(nextOrFinish.first()).toBeEnabled()
      await nextOrFinish.first().click()

      if (await page.getByText(/kết quả|result/i).first().isVisible().catch(() => false)) break
    }

    await expect(page.getByText(/kết quả|result|đáp án|answer/i).first()).toBeVisible()
  })

  test("chatbot returns an answer with source or fallback", async ({ page }) => {
    await login(page)
    await page.goto("/chatbot")
    await expect(page.getByText(/kami/i).first()).toBeVisible()

    const input = page.getByPlaceholder(/nhập câu hỏi|enter your question/i).first()
    await input.fill("学生 nghĩa là gì?")
    await input.press("Enter")

    await expect(page.getByText(/学生|nguồn tham khảo|mình chưa tìm thấy|fallback/i).first()).toBeVisible({
      timeout: 45_000,
    })
  })

  test("Kami can call the diagnostic quiz tool", async ({ page }) => {
    await login(page)
    await page.goto("/chatbot")

    await page.getByRole("button", { name: /chat mới|new chat/i }).first().click()
    const input = page.locator("textarea").first()
    await input.fill("Hãy kiểm tra trình độ N5 của tôi bằng 3 câu.")
    await input.press("Enter")

    await expect(page.getByRole("button", { name: /nộp bài|submit/i }).first()).toBeVisible({
      timeout: 60_000,
    })
  })

  test("reading page renders even when article data is empty", async ({ page }) => {
    await login(page)
    await page.goto("/reading")
    await expect(page.getByText(/bài đọc|reading|todaii|furigana/i).first()).toBeVisible()
  })
})
