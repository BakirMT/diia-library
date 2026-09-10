import * as React from "react"
import { Card } from "@/src/components/ui/card"

export default function ParentChildren() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Children</h1>
        <p className="text-slate-500 mt-1">View your linked students and their reading progress.</p>
      </div>
      <Card className="p-6">
        <div className="text-center text-slate-500 py-8">
          You currently have no children linked to your account.
        </div>
      </Card>
    </div>
  )
}
