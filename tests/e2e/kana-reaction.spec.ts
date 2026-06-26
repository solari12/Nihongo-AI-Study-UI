import { expect, test } from "@playwright/test"

test("Kana reaction advances to a different question after answering", async ({ page }) => {
  const registerResponse = await page.request.post("/api/auth/register", {
    data: {
      fullName: "Kana Test",
      email: `kana-${Date.now()}@example.com`,
      password: "password123",
    },
  })
  expect(registerResponse.ok()).toBeTruthy()

  await page.goto("/kana")
  await page.getByRole("tab", { name: /phản xạ kana/i }).click()
  await page.getByRole("button", { name: /bắt đầu kiểm tra/i }).click()

  const questionNumber = page.getByText(/câu 1\/10/i)
  await expect(questionNumber).toBeVisible()

  const kana = page.locator("main span.text-8xl").first()
  const firstKana = await kana.textContent()
  const answerButtons = page.locator("main button.h-16")
  await expect(answerButtons).toHaveCount(4)
  await answerButtons.first().click()

  await expect(page.getByText(/câu 2\/10/i)).toBeVisible()
  await expect(kana).not.toHaveText(firstKana ?? "")

  const secondKana = await kana.textContent()
  await expect(page.getByText(/câu 3\/10/i)).toBeVisible({ timeout: 10_000 })
  await expect(kana).not.toHaveText(secondKana ?? "")
})
