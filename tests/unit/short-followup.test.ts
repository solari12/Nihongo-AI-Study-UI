import assert from "node:assert/strict"
import test from "node:test"

import { isShortFollowUpReply } from "../../lib/chat/short-followup"

test("normalizes short affirmative and continue replies", () => {
  for (const message of ["có", "cóa", "ok", "oke", "ừ", "uh", "tiếp", "tiếp đi", "yes"]) {
    assert.equal(isShortFollowUpReply(message), true, message)
  }
})

test("does not treat ordinary questions as short follow-ups", () => {
  assert.equal(isShortFollowUpReply("giải thích ngữ pháp trong bài này"), false)
  assert.equal(isShortFollowUpReply("có bài nào khác không"), false)
})
