"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.positive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
