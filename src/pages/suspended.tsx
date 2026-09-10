import * as React from "react"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/src/lib/AuthContext"
import { Button } from "@/src/components/ui/button"

export default function Suspended() {
  const {  logout , libraryId } = useAuth()
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border-t-8 border-red-500">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Subscription Expired</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The subscription for this library branch has expired. Your data is safe, but you cannot log in until the Main Authority renews the subscription.
        </p>
        <Button onClick={() => logout()} className="w-full h-12 text-md rounded-xl bg-slate-900 hover:bg-slate-800">
          Sign Out
        </Button>
      </div>
    </div>
  )
}
