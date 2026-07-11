import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary'
  className?: string
  children?: React.ReactNode
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]": variant === "default",
          "border-transparent bg-green-100 text-green-800": variant === "success",
          "border-transparent bg-orange-100 text-orange-800": variant === "warning",
          "border-transparent bg-red-100 text-red-800": variant === "destructive",
          "border-[var(--color-border)] text-[var(--color-text-main)]": variant === "outline",
          "border-transparent bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-light)]": variant === "secondary",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
