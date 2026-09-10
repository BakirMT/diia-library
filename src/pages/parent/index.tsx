import * as React from "react"
import { Card } from "@/src/components/ui/card"
import { Users, BookOpen, Clock, AlertTriangle } from "lucide-react"

export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor your children's activity and manage your subscription.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Linked Students</p>
              <h3 className="text-2xl font-bold text-slate-900">2</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Loans</p>
              <h3 className="text-2xl font-bold text-slate-900">5</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Subscription Status</p>
              <h3 className="text-xl font-bold text-emerald-700">Active</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Child Activity</h3>
        <div className="text-center text-slate-500 py-8">
          No recent activity to display.
        </div>
      </Card>
    </div>
  )
}
