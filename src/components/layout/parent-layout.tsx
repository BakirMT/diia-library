import * as React from "react"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import { ParentSidebar } from "./parent-sidebar"
import { Topbar } from "./topbar"

export function ParentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[var(--color-background)] overflow-hidden">
      <ParentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
