import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  goal: z.string().trim().min(1).optional(),
})

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Thông tin đăng ký không hợp lệ." }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email,
      passwordHash: hashPassword(parsed.data.password),
      role: "learner",
    },
  })

  await createSession(user.id)

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 }
  )
}
