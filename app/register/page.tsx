"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole, UserPlus } from "lucide-react"
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
    backToIntro: isJapanese ? "\u7d39\u4ecb\u30da\u30fc\u30b8\u3078\u623b\u308b" : "V\u1ec1 trang gi\u1edbi thi\u1ec7u",
    sideKicker: isJapanese ? "N5\u5b66\u7fd2\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210" : "T\u1ea1o t\u00e0i kho\u1ea3n h\u1ecdc N5",
    sideTitle: isJapanese ? "\u3042\u306a\u305f\u306b\u5408\u3046N5\u5b66\u7fd2\u3092\u306f\u3058\u3081\u3088\u3046\u3002" : "B\u1eaft \u0111\u1ea7u N5 theo l\u1ed9 tr\u00ecnh c\u1ee7a ri\u00eang b\u1ea1n.",
    sideDescription: isJapanese
      ? "\u767b\u9332\u5f8c\u3001\u76ee\u6a19\u3084\u5b66\u7fd2\u6642\u9593\u3092\u9078\u3093\u3067\u3001\u6700\u521d\u306e\u8ab2\u984c\u307e\u3067\u9032\u3081\u307e\u3059\u3002"
      : "Sau khi \u0111\u0103ng k\u00fd, b\u1ea1n s\u1ebd ch\u1ecdn m\u1ee5c ti\u00eau, th\u1eddi gian h\u1ecdc v\u00e0 nh\u1eadn b\u01b0\u1edbc h\u1ecdc \u0111\u1ea7u ti\u00ean.",
    realAccount: isJapanese ? "\u5b66\u7fd2\u30a2\u30ab\u30a6\u30f3\u30c8" : "T\u00e0i kho\u1ea3n h\u1ecdc t\u1eadp",
    hashedPassword: isJapanese ? "\u5b89\u5fc3\u3057\u3066\u5229\u7528" : "S\u1eed d\u1ee5ng an t\u00e2m",
    privateOnboarding: isJapanese ? "\u81ea\u5206\u306e\u5b66\u7fd2\u8a08\u753b" : "L\u1ed9 tr\u00ecnh ri\u00eang",
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
    <div
      data-i18n-managed
      className="relative grid min-h-screen bg-[#fbf5ee] bg-[url('/assets/wallpaper.png')] bg-cover bg-center lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      <Button
        asChild
        variant="outline"
        size="sm"
        className="absolute left-4 top-4 z-20 border-[#ead7c9] bg-white/88 text-[#2c211c] shadow-sm backdrop-blur hover:bg-white"
      >
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {copy.backToIntro}
        </Link>
      </Button>
      <section className="hidden border-r border-[#ead7c9] bg-[#fffaf5]/70 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="relative overflow-hidden rounded-xl border border-[#ead7c9] bg-white/80 p-4 shadow-sm">
            <Image src="/assets/vocab-card-clean.png" alt="" aria-hidden="true" width={640} height={260} className="h-48 w-full object-contain" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#d94f45]">{copy.sideKicker}</p>
            <h1 className="text-4xl font-bold text-[#2c211c] text-balance">{copy.sideTitle}</h1>
            <p className="text-[#6f5952] text-balance">{copy.sideDescription}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4">
              <UserPlus className="mb-3 h-5 w-5 text-[#d94f45]" />
              <p className="text-sm font-medium">{copy.realAccount}</p>
            </div>
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-[#d94f45]" />
              <p className="text-sm font-medium">{copy.hashedPassword}</p>
            </div>
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4">
              <GraduationCap className="mb-3 h-5 w-5 text-[#d94f45]" />
              <p className="text-sm font-medium">{copy.privateOnboarding}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-6 py-10">
        <Image
          src="/assets/Flower.png"
          alt=""
          aria-hidden="true"
          width={120}
          height={120}
          className="pointer-events-none absolute right-6 top-8 hidden h-24 opacity-70 sm:block"
        />
        <Card className="w-full max-w-md border-[#ead7c9] bg-white/92 shadow-[0_18px_50px_rgba(76,48,35,0.12)] backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d94f45] text-white shadow-sm">
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

              <div className="grid gap-2 rounded-lg border border-[#ead7c9] bg-[#fff7ef] p-3">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn("h-4 w-4", check.valid ? "text-success" : "text-muted-foreground")} />
                    <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-[#d94f45] hover:bg-[#c7443b]" size="lg" type="submit" disabled={isSubmitting || !isLoaded || !canSubmit}>
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
