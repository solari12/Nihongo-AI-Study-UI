import assert from "node:assert/strict"
import test from "node:test"

import { calculateSm2 } from "../../lib/vocabulary/sm2"

const reviewedAt = new Date("2026-06-20T00:00:00.000Z")

test("forgot resets repetitions and increases lapses", () => {
  const result = calculateSm2({
    repetitions: 4,
    intervalDays: 20,
    easeFactor: 2.5,
    lapses: 2,
  }, "forgot", reviewedAt)

  assert.equal(result.quality, 1)
  assert.equal(result.repetitions, 0)
  assert.equal(result.intervalDays, 1)
  assert.equal(result.lapses, 3)
  assert.equal(result.stage, "learning")
})

test("first and second successful reviews use 1 and 6 day intervals", () => {
  const first = calculateSm2(null, "remembered", reviewedAt)
  assert.equal(first.repetitions, 1)
  assert.equal(first.intervalDays, 1)

  const second = calculateSm2(first, "remembered", reviewedAt)
  assert.equal(second.repetitions, 2)
  assert.equal(second.intervalDays, 6)
})

test("hard review never lowers ease factor below 1.3", () => {
  let progress = {
    repetitions: 2,
    intervalDays: 6,
    easeFactor: 1.3,
    lapses: 0,
  }

  for (let index = 0; index < 20; index += 1) {
    const result = calculateSm2(progress, "hard", reviewedAt)
    assert.ok(result.easeFactor >= 1.3)
    progress = result
  }
})

test("repeated success eventually marks vocabulary mastered", () => {
  let progress = calculateSm2(null, "remembered", reviewedAt)
  for (let index = 0; index < 5; index += 1) {
    progress = calculateSm2(progress, "remembered", reviewedAt)
  }

  assert.equal(progress.stage, "mastered")
  assert.ok(progress.intervalDays >= 30)
})
