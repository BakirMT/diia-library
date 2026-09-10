import * as React from "react"
import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function ParentSubscription() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plan</h1>
        <p className="text-slate-500 mt-1">Manage your active parent subscription.</p>
      </div>
      <Card className="p-8 border-2 border-emerald-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
          ACTIVE PLAN
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Family Premium</h2>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-extrabold text-slate-900">$19.99</span>
          <span className="text-slate-500 font-medium">/month</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          {['Monitor up to 5 children', 'Detailed reading analytics', 'Priority book reservations', 'Zero late fines (up to 3 days)'].map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-slate-700 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 text-md">
          Manage Billing
        </Button>
      </Card>
    </div>
  )
}
