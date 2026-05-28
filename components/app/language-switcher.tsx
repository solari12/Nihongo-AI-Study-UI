"use client"

import { Languages } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Locale, useI18n } from "@/lib/i18n"

const locales: Locale[] = ["vi", "en", "ja"]

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        aria-label={t("language.label")}
        className={compact ? "h-9 w-[76px]" : "h-9 w-[132px]"}
      >
        <Languages className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((item) => (
          <SelectItem key={item} value={item}>
            {compact ? item.toUpperCase() : t(`language.${item}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
