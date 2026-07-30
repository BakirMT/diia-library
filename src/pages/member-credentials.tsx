import * as React from "react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { fetchMembers } from "@/src/lib/db"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Search, Key, CheckCircle, Shield } from "lucide-react"
import { Avatar } from "@/src/components/ui/avatar"

export default function MemberCredentials() {
  const [members, setMembers] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedMember, setSelectedMember] = React.useState<any | null>(null)
  
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState("Active")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const loadMembers = async () => {
      const data = await fetchMembers()
      setMembers(data)
    }
    loadMembers()
  }, [])

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectMember = (member: any) => {
    setSelectedMember(member)
    setUsername(member.username || "")
    setEmail(member.email || "")
    setPassword(member.password || "")
    setStatus(member.status || "Active")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return
    setIsSaving(true)
    
    try {
      const memberRef = doc(db, 'members', selectedMember.id)
      await setDoc(memberRef, {
        username,
        email,
        password,
        status
      }, { merge: true })
      
      // Update local state
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, username, email, password, status } : m))
      alert("Credentials updated successfully!")
    } catch (error: any) {
      alert("Error updating credentials: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Member Credentials</h2>
        <p className="text-sm text-slate-500">Admin-only: Manage login access for members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border rounded-xl bg-white shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search members..." 
                className="pl-9 bg-slate-50 border-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedMember?.id === member.id ? 'bg-teal-50 text-[var(--color-primary)]' : 'hover:bg-slate-50'}`}
              >
                <Avatar src={member.photoURL} fallback={member.name} className="h-10 w-10 border shadow-sm" />
                <div className="overflow-hidden">
                  <div className="font-semibold text-sm truncate">{member.name}</div>
                  <div className={`text-xs truncate ${member.status === 'Active' && member.password ? 'text-green-600 font-medium' : 'text-slate-500'}`}>{member.email || 'No email'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedMember ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <Avatar src={selectedMember.photoURL} fallback={selectedMember.name} className="h-16 w-16 border-2 shadow-sm" />
                <div>
                  <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                  <p className="text-sm text-slate-500">ID: {selectedMember.id}</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Username</label>
                  <Input 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Set a username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email</label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Set login email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <Input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set a password"
                    required
                  />
                  <p className="text-xs text-slate-500">This password will only work on the Member login page.</p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <Button type="submit" disabled={isSaving} className="w-full">
                      {isSaving ? "Saving..." : "Save Credentials"}
                    </Button>
                  </div>
                  <div className="w-48">
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200 focus:border-transparent transition-colors"
                    >
                      <option value="Active">Active (Permit Login)</option>
                      <option value="Suspended">Suspended (Block Login)</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
              <Key className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Select a Member</h3>
              <p className="max-w-xs">Select a member from the list to view and manage their login credentials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
