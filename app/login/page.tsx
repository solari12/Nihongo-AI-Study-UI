"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { BookOpen, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react"
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
    sideTitle: isJapanese
      ? "PostgreSQL\u306b\u4fdd\u5b58\u3055\u308c\u305f\u500b\u4eba\u30c7\u30fc\u30bf\u3067N5\u3092\u5b66\u7fd2\u3002"
      : "H\u1ecdc N5 v\u1edbi d\u1eef li\u1ec7u c\u00e1 nh\u00e2n \u0111\u01b0\u1ee3c l\u01b0u trong PostgreSQL.",
    sideDescription: isJapanese
      ? "\u30a2\u30ab\u30a6\u30f3\u30c8\u3001\u30bb\u30c3\u30b7\u30e7\u30f3\u3001\u9032\u6357\u3001\u30af\u30a4\u30ba\u3001\u6d3b\u52d5\u5c65\u6b74\u306f\u30e6\u30fc\u30b6\u30fc\u3054\u3068\u306b\u7ba1\u7406\u3055\u308c\u307e\u3059\u3002"
      : "T\u00e0i kho\u1ea3n, phi\u00ean \u0111\u0103ng nh\u1eadp, ti\u1ebfn \u0111\u1ed9, quiz v\u00e0 l\u1ecbch s\u1eed ho\u1ea1t \u0111\u1ed9ng \u0111\u01b0\u1ee3c g\u1eafn v\u1edbi t\u1eebng ng\u01b0\u1eddi d\u00f9ng.",
    sessionSecurity: isJapanese ? "\u5b89\u5168\u306a\u30bb\u30c3\u30b7\u30e7\u30f3" : "Session b\u1ea3o m\u1eadt",
    sessionSecurityDesc: isJapanese ? "httpOnly Cookie\u3068DB\u5185\u306e\u30cf\u30c3\u30b7\u30e5\u6e08\u307f\u30c8\u30fc\u30af\u30f3\u3002" : "Cookie httpOnly v\u00e0 token hash trong database.",
    privateProgress: isJapanese ? "\u500b\u5225\u306e\u9032\u6357" : "Ti\u1ebfn \u0111\u1ed9 ri\u00eang",
    privateProgressDesc: isJapanese ? "\u5b66\u7fd2\u30c7\u30fc\u30bf\u306f\u30a2\u30ab\u30a6\u30f3\u30c8\u3054\u3068\u306b\u5206\u96e2\u3055\u308c\u307e\u3059\u3002" : "D\u1eef li\u1ec7u h\u1ecdc t\u1eadp \u0111\u01b0\u1ee3c t\u00e1ch theo t\u00e0i kho\u1ea3n.",
    ragChatbot: isJapanese ? "\u6559\u6750\u5bfe\u5fdc\u30c1\u30e3\u30c3\u30c8\u30dc\u30c3\u30c8" : "Chatbot theo n\u1ed9i dung h\u1ec7 th\u1ed1ng",
    ragChatbotDesc: isJapanese ? "\u8cea\u554f\u306f\u8a8d\u8a3c\u6e08\u307fAPI\u3067\u51e6\u7406\u3055\u308c\u307e\u3059\u3002" : "C\u00e2u h\u1ecfi \u0111\u01b0\u1ee3c x\u1eed l\u00fd qua API \u0111\u00e3 y\u00eau c\u1ea7u \u0111\u0103ng nh\u1eadp.",
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
    <div data-i18n-managed className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting || !isLoaded}>
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

      <section className="hidden border-l bg-muted/40 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Nihongo AI Study</p>
            <h1 className="text-4xl font-bold text-balance">{copy.sideTitle}</h1>
            <p className="text-muted-foreground text-balance">{copy.sideDescription}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">{copy.sessionSecurity}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.sessionSecurityDesc}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <BookOpen className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">{copy.privateProgress}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.privateProgressDesc}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 sm:col-span-2">
              <Sparkles className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-medium">{copy.ragChatbot}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.ragChatbotDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
