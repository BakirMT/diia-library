import * as React from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { History, Star } from "lucide-react"

const MOCK_HISTORY = [
  { id: '1', title: 'Atomic Habits', author: 'James Clear', borrowed: '2026-05-01', returned: '2026-05-15', rating: 5 },
  { id: '2', title: 'The Hobbit', author: 'J.R.R. Tolkien', borrowed: '2026-04-10', returned: '2026-04-24', rating: 4 },
  { id: '3', title: 'Dune', author: 'Frank Herbert', borrowed: '2026-03-05', returned: '2026-03-20', rating: 5 },
  { id: '4', title: 'Project Hail Mary', author: 'Andy Weir', borrowed: '2026-02-15', returned: '2026-03-01', rating: 4 },
];

export default function StudentHistory() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reading History</h2>
          <p className="text-sm text-slate-500">Books you have checked out and checked in in the past.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Book</th>
                  <th className="px-6 py-4 font-medium">Check Out Date</th>
                  <th className="px-6 py-4 font-medium">Check In Date</th>
                  <th className="px-6 py-4 font-medium">Your Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_HISTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <History className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{item.borrowed}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{item.returned}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-teal-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
