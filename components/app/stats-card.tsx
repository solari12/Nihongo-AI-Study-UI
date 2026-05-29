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
  contentClassName?: string
  iconClassName?: string
  titleClassName?: string
  valueClassName?: string
  subtitleClassName?: string
  style?: React.CSSProperties
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  contentClassName,
  iconClassName,
  titleClassName,
  valueClassName,
  subtitleClassName,
  style,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)} style={style}>
      <CardContent className={cn("p-6", contentClassName)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium text-muted-foreground", titleClassName)}>{title}</p>
            <p className={cn("text-3xl font-bold", valueClassName)}>{value}</p>
            {subtitle && (
              <p className={cn("text-sm text-muted-foreground", subtitleClassName)}>{subtitle}</p>
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
          <div className={cn("rounded-lg bg-primary/10 p-3 text-primary", iconClassName)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
