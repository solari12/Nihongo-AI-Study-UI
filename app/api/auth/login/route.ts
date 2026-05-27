import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không hợp lệ." }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email },
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
