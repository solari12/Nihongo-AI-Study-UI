"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageSquare, X } from "lucide-react"
import ChatbotPage from "@/app/(app)/chatbot/page"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export const KAMI_CHAT_OPEN_EVENT = "kami-chat:open"

export function openKamiChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(KAMI_CHAT_OPEN_EVENT))
}

export function KamiFloatingChat() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()
  const isChatbotPage = pathname === "/chatbot"

  useEffect(() => {
    const handleOpen = () => setOpen(true)

    window.addEventListener(KAMI_CHAT_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(KAMI_CHAT_OPEN_EVENT, handleOpen)
  }, [])

  if (isChatbotPage) return null

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          <div className="absolute inset-0 bg-[#2b1f1b]/15 backdrop-blur-[1px] pointer-events-auto" onClick={() => setOpen(false)} />
          <section className="pointer-events-auto absolute bottom-5 right-5 flex h-[min(760px,calc(100vh-2.5rem))] w-[min(460px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-[#e7bdb4] bg-white shadow-[0_24px_70px_rgba(100,54,48,0.24)]">
            <div className="flex items-center justify-between border-b border-[#f0d2cb] bg-[#fff7f1] px-4 py-3">
              <div className="flex items-center gap-2">
                <img src="/assets/kami-logo.png" alt="" className="h-9 w-9 object-contain" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#2b211c]">{t("chatbot.title")}</p>
                  <p className="text-xs text-[#8a625c]">{t("chatbot.description")}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-[#8a625c] hover:bg-[#ffe4df] hover:text-[#b94d55]"
                onClick={() => setOpen(false)}
                aria-label="Close Kami"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatbotPage compact />
            </div>
          </section>
        </div>
      )}

      <Button
        type="button"
        className="fixed bottom-5 right-5 z-[70] h-16 w-16 rounded-full bg-[#e96f78] p-1.5 text-white shadow-[0_18px_38px_rgba(217,79,91,0.35)] hover:bg-[#d94f5b]"
        onClick={() => setOpen(true)}
        aria-label="Open Kami"
      >
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#fff0ef]">
          <img src="/assets/kami-logo.png" alt="" className="h-full w-full object-contain p-1" aria-hidden="true" />
          <MessageSquare className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#e96f78] p-1 text-white" />
        </span>
      </Button>
    </>
  )
}
