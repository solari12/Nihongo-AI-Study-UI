import { NextRequest, NextResponse } from "next/server"
import { createSession, hashPassword } from "@/lib/auth"
import { formatZodError, readJsonRequest, registerSchema } from "@/lib/auth-validation"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const body = await readJsonRequest(request)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existingUser) {
    return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
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
