import "server-only"

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export const AUTH_COOKIE_NAME = "nihongo_session"
const SESSION_DAYS = 30
const SCRYPT_KEY_LENGTH = 64

export type AuthUser = {
  id: string
  name: string
  email: string
  role: "learner" | "admin"
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex")
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false

  const [algorithm, salt, hash] = storedHash.split(":")
  if (algorithm !== "scrypt" || !salt || !hash) return false

  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function toAuthUser(user: { id: string; fullName: string; email: string; role: "learner" | "admin" }): AuthUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
  }
}

type SessionUserRow = {
  session_id: string
  expires_at: Date
  user_id: string
  full_name: string
  email: string
  role: "learner" | "admin"
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.$executeRaw`
    INSERT INTO "auth_sessions" ("id", "user_id", "token_hash", "expires_at", "created_at")
    VALUES (gen_random_uuid()::text, ${userId}, ${tokenHash}, ${expiresAt}, CURRENT_TIMESTAMP)
  `

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const rows = await prisma.$queryRaw<SessionUserRow[]>`
    SELECT
      s."id" as session_id,
      s."expires_at",
      u."id" as user_id,
      u."full_name",
      u."email",
      u."role"
    FROM "auth_sessions" s
    INNER JOIN "users" u ON u."id" = s."user_id"
    WHERE s."token_hash" = ${hashSessionToken(token)}
    LIMIT 1
  `

  const session = rows[0]

  if (!session || session.expires_at <= new Date()) {
    if (session) {
      await prisma.$executeRaw`DELETE FROM "auth_sessions" WHERE "id" = ${session.session_id}`
    }
    cookieStore.delete(AUTH_COOKIE_NAME)
    return null
  }

  return toAuthUser({
    id: session.user_id,
    fullName: session.full_name,
    email: session.email,
    role: session.role,
  })
}

export async function requireAdminUser() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    return null
  }

  return user
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (token) {
    await prisma.$executeRaw`DELETE FROM "auth_sessions" WHERE "token_hash" = ${hashSessionToken(token)}`
  }

  cookieStore.delete(AUTH_COOKIE_NAME)
}
