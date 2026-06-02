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

const locales: Locale[] = ["vi", "ja"]

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        aria-label="Language"
        className={compact ? "h-9 w-[76px]" : "h-9 w-[132px]"}
      >
        <Languages className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((item) => (
          <SelectItem key={item} value={item}>
            {compact ? item.toUpperCase() : item === "vi" ? "Ti\u1ebfng Vi\u1ec7t" : "\u65e5\u672c\u8a9e"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
