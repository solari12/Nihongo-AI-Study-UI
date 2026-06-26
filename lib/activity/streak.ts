type StreakActivity = {
  createdAt: string
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function buildStudyStreak(activities: StreakActivity[]) {
  const activeDays = new Set(
    activities
      .map((activity) => new Date(activity.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(toLocalDateKey)
  )
  let streak = 0
  const cursor = new Date()

  while (activeDays.has(toLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
