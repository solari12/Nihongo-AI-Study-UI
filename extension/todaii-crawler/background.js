const API_URL = "http://localhost:3000/api/admin/todaii-news/import"
const IMPORT_TOKEN = "Tuandaito"

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "todaii-import") return false

  fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-import-token": IMPORT_TOKEN,
    },
    body: JSON.stringify(message.payload),
  })
    .then(async (response) => {
      const body = await response.json().catch(() => null)
      sendResponse({
        ok: response.ok,
        status: response.status,
        body,
      })
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        status: 0,
        body: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    })

  return true
})
