import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export function ContentLoadingCard({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
        <Spinner className="h-5 w-5" />
        <span>{label}</span>
      </CardContent>
    </Card>
  )
}

export function ContentErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Không tải được dữ liệu mới nhất</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
