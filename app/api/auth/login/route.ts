import { NextRequest, NextResponse } from "next/server"
import { createSession, verifyPassword } from "@/lib/auth"
import { formatZodError, loginSchema, readJsonRequest } from "@/lib/auth-validation"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const body = await readJsonRequest(request)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 })
  }

  await createSession(user.id)

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    },
  })
}
