import * as React from "react"
import { Card } from "@/src/components/ui/card"

export default function ParentSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parent Settings</h1>
        <p className="text-slate-500 mt-1">Configure your notification preferences.</p>
      </div>
      <Card className="p-6">
        <div className="text-slate-500">
          Settings are coming soon.
        </div>
      </Card>
    </div>
  )
}
