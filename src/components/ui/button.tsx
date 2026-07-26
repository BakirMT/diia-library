import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[var(--color-primary)] text-white hover:bg-teal-600 shadow-md shadow-teal-200': variant === 'default',
            'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600': variant === 'outline',
            'hover:bg-slate-100 hover:text-slate-900 text-slate-500': variant === 'ghost',
            'bg-slate-900 text-white hover:bg-slate-800 shadow-md': variant === 'secondary',
            'text-[var(--color-primary)] underline-offset-4 hover:underline': variant === 'link',
            
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3': size === 'sm',
            'h-11 px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
