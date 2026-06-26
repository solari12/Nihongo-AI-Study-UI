import { expect, test } from "@playwright/test"

test("saved study items can be reviewed, quizzed, and removed", async ({ page }) => {
  const registerResponse = await page.request.post("/api/auth/register", {
    data: {
      fullName: "Saved Items Test",
      email: `saved-${Date.now()}@example.com`,
      password: "password123",
    },
  })
  expect(registerResponse.ok()).toBeTruthy()

  for (const item of [
    { type: "vocabulary", itemKey: "test-neko", title: "猫", reading: "ねこ", meaning: "con mèo", level: "N5" },
    { type: "grammar", itemKey: "test-temo", title: "～ても", meaning: "dù cho, kể cả khi", level: "N4" },
  ] as const) {
    const response = await page.request.post("/api/saved-study-items", {
      data: {
        ...item,
        sourceType: "e2e",
        sourceId: "saved-items-test",
        rawPayload: item,
      },
    })
    expect(response.ok()).toBeTruthy()
  }

  await page.goto("/saved-items")
  await expect(page.getByRole("heading", { name: "猫" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "～ても" })).toBeVisible()

  await page.getByRole("link", { name: /quiz từ mục đã lưu/i }).click()
  await expect(page.getByText("Mục đã lưu")).toBeVisible()
  await page.getByRole("button", { name: /bắt đầu 2 câu/i }).click()
  await expect(page.getByText(/nghĩa là gì|dùng để diễn đạt gì/i)).toBeVisible()

  await page.goto("/saved-items")
  await expect(page.getByRole("button", { name: /bỏ lưu/i })).toHaveCount(2)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: /bỏ lưu/i }).first().click()
  await expect(page.getByRole("button", { name: /bỏ lưu/i })).toHaveCount(1)
})
