"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LanguageSwitcher } from "@/components/app/language-switcher"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const { activeUser, isLoaded, register } = useAuth()
  const { locale } = useI18n()
  const isJapanese = locale === "ja"
  const copy = {
    title: isJapanese ? "\u767b\u9332" : "\u0110\u0103ng k\u00fd",
    description: isJapanese ? "\u65b0\u3057\u3044\u5b66\u7fd2\u8005\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210\u3057\u307e\u3059\u3002" : "T\u1ea1o t\u00e0i kho\u1ea3n ng\u01b0\u1eddi h\u1ecdc m\u1edbi.",
    fullName: isJapanese ? "\u6c0f\u540d" : "H\u1ecd v\u00e0 t\u00ean",
    namePlaceholder: isJapanese ? "\u5c71\u7530 \u592a\u90ce" : "Nguy\u1ec5n V\u0103n A",
    email: isJapanese ? "\u30e1\u30fc\u30eb" : "Email",
    emailPlaceholder: isJapanese ? "you@example.com" : "ban@example.com",
    password: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9" : "M\u1eadt kh\u1ea9u",
    passwordPlaceholder: isJapanese ? "8\u6587\u5b57\u4ee5\u4e0a" : "\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1",
    confirmPassword: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u78ba\u8a8d" : "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u",
    confirmPasswordPlaceholder: isJapanese ? "\u3082\u3046\u4e00\u5ea6\u5165\u529b" : "Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u",
    showPassword: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u8868\u793a" : "Hi\u1ec7n m\u1eadt kh\u1ea9u",
    hidePassword: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u96a0\u3059" : "\u1ea8n m\u1eadt kh\u1ea9u",
    checkLength: isJapanese ? "8\u6587\u5b57\u4ee5\u4e0a" : "\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1",
    checkLetter: isJapanese ? "\u82f1\u5b57\u3092\u542b\u3080" : "C\u00f3 ch\u1eef c\u00e1i",
    checkNumber: isJapanese ? "\u6570\u5b57\u3092\u542b\u3080" : "C\u00f3 ch\u1eef s\u1ed1",
    checkMatch: isJapanese ? "\u78ba\u8a8d\u304c\u4e00\u81f4" : "X\u00e1c nh\u1eadn kh\u1edbp",
    invalidForm: isJapanese ? "\u6c0f\u540d\u3001\u30e1\u30fc\u30eb\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002" : "Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i h\u1ecd t\u00ean, email v\u00e0 m\u1eadt kh\u1ea9u.",
    fallbackError: isJapanese ? "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210\u3067\u304d\u307e\u305b\u3093\u3002" : "Kh\u00f4ng th\u1ec3 t\u1ea1o t\u00e0i kho\u1ea3n.",
    loading: isJapanese ? "\u4f5c\u6210\u4e2d..." : "\u0110ang t\u1ea1o t\u00e0i kho\u1ea3n...",
    submit: isJapanese ? "\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210" : "T\u1ea1o t\u00e0i kho\u1ea3n",
    hasAccount: isJapanese ? "\u3059\u3067\u306b\u30a2\u30ab\u30a6\u30f3\u30c8\u304c\u3042\u308a\u307e\u3059\u304b\uff1f" : "\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?",
    login: isJapanese ? "\u30ed\u30b0\u30a4\u30f3" : "\u0110\u0103ng nh\u1eadp",
    sideKicker: isJapanese ? "N5\u5b66\u7fd2\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210" : "T\u1ea1o t\u00e0i kho\u1ea3n h\u1ecdc N5",
    sideTitle: isJapanese ? "\u5b66\u7fd2\u8005\u3054\u3068\u306b\u30c7\u30fc\u30bf\u3068\u9032\u6357\u3092\u7ba1\u7406\u3002" : "M\u1ed7i ng\u01b0\u1eddi h\u1ecdc c\u00f3 d\u1eef li\u1ec7u v\u00e0 ti\u1ebfn \u0111\u1ed9 ri\u00eang.",
    sideDescription: isJapanese
      ? "\u767b\u9332\u5f8c\u3001PostgreSQL\u306b\u30e6\u30fc\u30b6\u30fc\u3092\u4f5c\u6210\u3057\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u30cf\u30c3\u30b7\u30e5\u5316\u3057\u3066\u81ea\u52d5\u7684\u306b\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u958b\u59cb\u3057\u307e\u3059\u3002"
      : "Sau khi \u0111\u0103ng k\u00fd, h\u1ec7 th\u1ed1ng t\u1ea1o user trong PostgreSQL, hash m\u1eadt kh\u1ea9u v\u00e0 m\u1edf phi\u00ean \u0111\u0103ng nh\u1eadp t\u1ef1 \u0111\u1ed9ng.",
    realAccount: isJapanese ? "\u672c\u756a\u30a2\u30ab\u30a6\u30f3\u30c8" : "T\u00e0i kho\u1ea3n th\u1eadt",
    hashedPassword: isJapanese ? "\u30cf\u30c3\u30b7\u30e5\u5316\u30d1\u30b9\u30ef\u30fc\u30c9" : "M\u1eadt kh\u1ea9u hash",
    privateOnboarding: isJapanese ? "\u500b\u5225\u30aa\u30f3\u30dc\u30fc\u30c7\u30a3\u30f3\u30b0" : "Onboarding ri\u00eang",
  }
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded || !activeUser) return
    router.replace(activeUser.role === "admin" ? "/admin" : "/dashboard")
  }, [activeUser, isLoaded, router])

  const passwordChecks = useMemo(
    () => [
      { label: copy.checkLength, valid: password.length >= 8 },
      { label: copy.checkLetter, valid: /[A-Za-z]/.test(password) },
      { label: copy.checkNumber, valid: /[0-9]/.test(password) },
      { label: copy.checkMatch, valid: confirmPassword.length > 0 && password === confirmPassword },
    ],
    [confirmPassword, password, copy.checkLength, copy.checkLetter, copy.checkMatch, copy.checkNumber]
  )

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    passwordChecks.every((check) => check.valid)

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!canSubmit) {
      setError(copy.invalidForm)
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName,
        email,
        password,
      })
      router.push("/onboarding")
      router.refresh()
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : copy.fallbackError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div data-i18n-managed className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="hidden border-r bg-muted/40 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">{copy.sideKicker}</p>
            <h1 className="text-4xl font-bold text-balance">{copy.sideTitle}</h1>
            <p className="text-muted-foreground text-balance">{copy.sideDescription}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <UserPlus className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{copy.realAccount}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{copy.hashedPassword}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <GraduationCap className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{copy.privateOnboarding}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md border shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xl font-bold">{"\u65e5"}</span>
              </div>
              <LanguageSwitcher />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{copy.title}</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">{copy.fullName}</Label>
                <Input
                  id="fullName"
                  placeholder={copy.namePlaceholder}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{copy.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{copy.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={copy.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn("h-4 w-4", check.valid ? "text-success" : "text-muted-foreground")} />
                    <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || !isLoaded || !canSubmit}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {copy.loading}
                  </>
                ) : (
                  copy.submit
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              {copy.hasAccount}{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {copy.login}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
