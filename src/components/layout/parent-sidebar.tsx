import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, BookOpen, Clock, Settings, X, GraduationCap, Users } from "lucide-react"

interface ParentSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: "Dashboard", href: "/parent", icon: Home },
  { name: "My Children", href: "/parent/children", icon: Users },
  { name: "Subscription", href: "/parent/subscription", icon: Clock },
  { name: "Settings", href: "/parent/settings", icon: Settings },
]

export function ParentSidebar({ isOpen, onClose }: ParentSidebarProps) {
  const location = useLocation()

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <Users className="h-6 w-6 text-amber-500" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Parent Portal</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 custom-scrollbar">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                  onClick={() => onClose()}
                >
                  <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
