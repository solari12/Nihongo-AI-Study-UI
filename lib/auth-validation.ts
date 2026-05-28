import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .max(128, "Mật khẩu không được quá 128 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu cần có ít nhất 1 chữ cái.")
  .regex(/[0-9]/, "Mật khẩu cần có ít nhất 1 chữ số.")

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên cần ít nhất 2 ký tự.")
    .max(80, "Họ tên không được quá 80 ký tự."),
  email: z.string().trim().email("Email không hợp lệ.").transform((value) => value.toLowerCase()),
  password: passwordSchema,
})

export function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ."
}

export async function readJsonRequest(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
