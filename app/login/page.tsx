"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, BookOpen, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LanguageSwitcher } from "@/components/app/language-switcher"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n"

export default function LoginPage() {
  const router = useRouter()
  const { activeUser, isLoaded, login } = useAuth()
  const { locale } = useI18n()
  const isJapanese = locale === "ja"
  const copy = {
    title: isJapanese ? "\u30ed\u30b0\u30a4\u30f3" : "\u0110\u0103ng nh\u1eadp",
    description: isJapanese
      ? "\u767b\u9332\u6e08\u307f\u30a2\u30ab\u30a6\u30f3\u30c8\u3067\u5b66\u7fd2\u3092\u7d9a\u3051\u307e\u3059\u3002"
      : "Ti\u1ebfp t\u1ee5c h\u1ecdc v\u1edbi t\u00e0i kho\u1ea3n \u0111\u00e3 \u0111\u0103ng k\u00fd.",
    email: isJapanese ? "\u30e1\u30fc\u30eb" : "Email",
    emailPlaceholder: isJapanese ? "you@example.com" : "ban@example.com",
    password: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9" : "M\u1eadt kh\u1ea9u",
    passwordPlaceholder: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b" : "Nh\u1eadp m\u1eadt kh\u1ea9u",
    showPassword: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u8868\u793a" : "Hi\u1ec7n m\u1eadt kh\u1ea9u",
    hidePassword: isJapanese ? "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u96a0\u3059" : "\u1ea8n m\u1eadt kh\u1ea9u",
    loginButton: isJapanese ? "\u30ed\u30b0\u30a4\u30f3" : "\u0110\u0103ng nh\u1eadp",
    loginLoading: isJapanese ? "\u30ed\u30b0\u30a4\u30f3\u4e2d..." : "\u0110ang \u0111\u0103ng nh\u1eadp...",
    loginError: isJapanese ? "\u30ed\u30b0\u30a4\u30f3\u3067\u304d\u307e\u305b\u3093\u3002" : "Kh\u00f4ng th\u1ec3 \u0111\u0103ng nh\u1eadp.",
    noAccount: isJapanese ? "\u30a2\u30ab\u30a6\u30f3\u30c8\u304c\u3042\u308a\u307e\u305b\u3093\u304b\uff1f" : "Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n?",
    register: isJapanese ? "\u767b\u9332" : "\u0110\u0103ng k\u00fd",
    backToIntro: isJapanese ? "\u7d39\u4ecb\u30da\u30fc\u30b8\u3078\u623b\u308b" : "V\u1ec1 trang gi\u1edbi thi\u1ec7u",
    sideTitle: isJapanese
      ? "\u81ea\u5206\u306e\u30da\u30fc\u30b9\u3067N5\u3092\u7d9a\u3051\u3088\u3046\u3002"
      : "Ti\u1ebfp t\u1ee5c l\u1ed9 tr\u00ecnh N5 c\u1ee7a ri\u00eang b\u1ea1n.",
    sideDescription: isJapanese
      ? "\u524d\u56de\u306e\u9032\u6357\u3001\u5b66\u7fd2\u30bf\u30b9\u30af\u3001Kami\u3068\u306e\u4f1a\u8a71\u304b\u3089\u3059\u3050\u518d\u958b\u3067\u304d\u307e\u3059\u3002"
      : "Quay l\u1ea1i b\u00e0i h\u1ecdc, xem ti\u1ebfn \u0111\u1ed9 v\u00e0 h\u1ecfi Kami khi c\u1ea7n gi\u1ea3i th\u00edch.",
    sessionSecurity: isJapanese ? "\u5b89\u5fc3\u3057\u3066\u30ed\u30b0\u30a4\u30f3" : "\u0110\u0103ng nh\u1eadp an to\u00e0n",
    sessionSecurityDesc: isJapanese ? "\u30a2\u30ab\u30a6\u30f3\u30c8\u306f\u5b89\u5168\u306b\u4fdd\u8b77\u3055\u308c\u307e\u3059\u3002" : "T\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n \u0111\u01b0\u1ee3c b\u1ea3o v\u1ec7 khi h\u1ecdc.",
    privateProgress: isJapanese ? "\u9032\u6357\u3092\u7d9a\u304d\u304b\u3089" : "H\u1ecdc ti\u1ebfp \u0111\u00fang ch\u1ed7",
    privateProgressDesc: isJapanese ? "\u524d\u56de\u306e\u5b66\u7fd2\u7d50\u679c\u304b\u3089\u6b21\u306e\u8ab2\u984c\u3092\u63d0\u6848\u3057\u307e\u3059\u3002" : "H\u1ec7 th\u1ed1ng g\u1ee3i \u00fd b\u00e0i ti\u1ebfp theo t\u1eeb ti\u1ebfn \u0111\u1ed9 c\u1ee7a b\u1ea1n.",
    ragChatbot: isJapanese ? "Kami\u3068\u5b66\u7fd2\u76f8\u8ac7" : "H\u1ecfi Kami khi b\u00ed",
    ragChatbotDesc: isJapanese ? "\u8a9e\u5f59\u3001\u6587\u6cd5\u3001\u8aad\u89e3\u3092\u3084\u3055\u3057\u304f\u8aac\u660e\u3057\u307e\u3059\u3002" : "Kami gi\u1ea3i th\u00edch t\u1eeb v\u1ef1ng, ng\u1eef ph\u00e1p v\u00e0 b\u00e0i \u0111\u1ecdc theo c\u00e1ch d\u1ec5 hi\u1ec3u.",
  }
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoaded || !activeUser) return
    router.replace(activeUser.role === "admin" ? "/admin" : "/dashboard")
  }, [activeUser, isLoaded, router])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const user = await login({ email, password })
      router.push(user?.role === "admin" ? "/admin" : "/dashboard")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : copy.loginError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-i18n-managed
      className="relative grid min-h-screen bg-[#fbf5ee] bg-[url('/assets/wallpaper.png')] bg-cover bg-center lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
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
      <section className="relative flex items-center justify-center px-6 py-10">
        <Image
          src="/assets/Flower.png"
          alt=""
          aria-hidden="true"
          width={120}
          height={120}
          className="pointer-events-none absolute left-6 top-8 hidden h-24 opacity-70 sm:block"
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
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                    autoComplete="current-password"
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

              <Button className="w-full bg-[#d94f45] hover:bg-[#c7443b]" size="lg" type="submit" disabled={isSubmitting || !isLoaded}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {copy.loginLoading}
                  </>
                ) : (
                  copy.loginButton
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              {copy.noAccount}{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {copy.register}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </section>

      <section className="hidden border-l border-[#ead7c9] bg-[#fffaf5]/70 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="relative overflow-hidden rounded-xl border border-[#ead7c9] bg-white/80 p-4 shadow-sm">
            <Image src="/assets/hero-torii.png" alt="" aria-hidden="true" width={640} height={260} className="h-48 w-full object-contain" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#d94f45]">Nihongo AI Study</p>
            <h1 className="text-4xl font-bold text-[#2c211c] text-balance">{copy.sideTitle}</h1>
            <p className="text-[#6f5952] text-balance">{copy.sideDescription}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-[#d94f45]" />
              <h2 className="font-medium">{copy.sessionSecurity}</h2>
              <p className="mt-1 text-sm text-[#6f5952]">{copy.sessionSecurityDesc}</p>
            </div>
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4">
              <BookOpen className="mb-3 h-5 w-5 text-[#d94f45]" />
              <h2 className="font-medium">{copy.privateProgress}</h2>
              <p className="mt-1 text-sm text-[#6f5952]">{copy.privateProgressDesc}</p>
            </div>
            <div className="rounded-lg border border-[#ead7c9] bg-white/85 p-4 sm:col-span-2">
              <Sparkles className="mb-3 h-5 w-5 text-[#d94f45]" />
              <h2 className="font-medium">{copy.ragChatbot}</h2>
              <p className="mt-1 text-sm text-[#6f5952]">{copy.ragChatbotDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
