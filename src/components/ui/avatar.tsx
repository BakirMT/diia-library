import * as React from "react"
import { cn } from "@/src/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function Avatar({ className, src, fallback, size = 'md', ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-slate-100",
        {
          "h-8 w-8": size === 'sm',
          "h-10 w-10": size === 'md',
          "h-12 w-12": size === 'lg',
        },
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          className="aspect-square h-full w-full object-cover"
          alt="Avatar"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--color-navy)]">
          {fallback || 'U'}
        </div>
      )}
    </div>
  )
}
