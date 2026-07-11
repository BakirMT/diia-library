import * as React from "react"
import { Card, CardContent } from "@/src/components/ui/card"

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">{title}</h2>
        <p className="text-[var(--color-text-muted)]">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-slate-400 text-3xl">🚧</span>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-main)] mb-2">Under Construction</h3>
          <p className="text-sm text-[var(--color-text-muted)] text-center max-w-md">
            The {title} module is currently being developed and will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
