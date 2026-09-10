const fs = require('fs');

const content = `import * as React from "react"
import { useAuth } from "@/src/lib/AuthContext"
import { db } from "@/src/lib/firebase"
import { collection, getDocs, setDoc, doc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/src/lib/firebase"
import { Shield, Plus, Building2, Clock, CheckCircle2, Edit2, User, Phone, MapPin, Mail, Lock } from "lucide-react"
import { Card } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"

export default function SuperAdmin() {
  const { logout } = useAuth()
  const [libraries, setLibraries] = React.useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingLib, setEditingLib] = React.useState<any>(null)
  const [formData, setFormData] = React.useState({
    name: '', email: '', password: '', endDate: '', buyerName: '', phone: '', address: ''
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchLibraries()
  }, [])

  const fetchLibraries = async () => {
    setLoading(true)
    const querySnapshot = await getDocs(collection(db, "libraries"))
    const libs: any[] = []
    querySnapshot.forEach(doc => {
      libs.push({ id: doc.id, ...doc.data() })
    })
    setLibraries(libs)
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingLib(null)
    setFormData({
      name: '', email: '', password: '', endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], buyerName: '', phone: '', address: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (lib: any) => {
    setEditingLib(lib)
    setFormData({
      name: lib.name || '',
      email: lib.adminEmail || '',
      password: lib.adminPassword || '',
      endDate: lib.subscriptionEndDate ? new Date(lib.subscriptionEndDate).toISOString().split('T')[0] : '',
      buyerName: lib.buyerName || '',
      phone: lib.phone || '',
      address: lib.address || ''
    })
    setIsModalOpen(true)
  }

  const handleSaveLibrary = async () => {
    try {
      const { name, email, password, endDate, buyerName, phone, address } = formData
      if (!name || !email || !password || !endDate) return alert("Please fill the required fields (Name, Email, Password, Date)")
      
      const libraryId = editingLib ? editingLib.id : (name.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now())
      
      if (!editingLib) {
        // Only try to create auth user if it's new
        let userCred
        try {
          userCred = await createUserWithEmailAndPassword(auth, email, "LibraryAdmin123!")
          
          await setDoc(doc(db, 'users', userCred.user.uid), {
            role: 'Admin',
            libraryId: libraryId,
            displayName: buyerName || 'Library Admin',
            email: email,
            username: email.split('@')[0]
          })
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
             // Ignore for preview purposes if email already in use, login will handle fallback
          } else {
             console.error(e)
          }
        }
      }

      const parsedEndDate = new Date(endDate)
      parsedEndDate.setHours(23, 59, 59)
      
      // Update/Create library doc
      await setDoc(doc(db, "libraries", libraryId), {
        name,
        adminEmail: email,
        adminPassword: password,
        subscriptionEndDate: parsedEndDate.toISOString(),
        buyerName,
        phone,
        address,
        status: 'Active'
      }, { merge: true })
      

      setIsModalOpen(false)
      fetchLibraries()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleAddMonths = async (id: string, currentEnd: string, addedMonths: number) => {
    try {
      const date = new Date(currentEnd)
      if (date < new Date()) {
         date.setTime(Date.now())
      }
      date.setMonth(date.getMonth() + addedMonths)
      await setDoc(doc(db, "libraries", id), { subscriptionEndDate: date.toISOString() }, { merge: true })
      fetchLibraries()
    } catch (e: any) {
      alert("Failed: " + e.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-16 bg-slate-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-lg"><Shield className="h-5 w-5 text-white" /></div>
          <span className="text-white font-bold tracking-tight text-lg">Main Authority Portal</span>
        </div>
        <Button onClick={logout} variant="ghost" className="text-slate-300 hover:text-white">Sign Out</Button>
      </div>

      <div className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Library Tenants</h1>
            <p className="text-slate-500 mt-1">Manage library branches, subscriptions, and billing details.</p>
          </div>
          <Button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-6 rounded-xl shrink-0">
            <Plus className="w-5 h-5 mr-2" /> Register New Tenant
          </Button>
        </div>

        {loading ? (
           <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {libraries.map(lib => {
              const endDate = new Date(lib.subscriptionEndDate)
              const isExpired = endDate < new Date()
              
              return (
                <Card key={lib.id} className={\`relative flex flex-col overflow-hidden transition-all hover:shadow-lg border-2 \${isExpired ? 'border-red-100 hover:border-red-300' : 'border-slate-100 hover:border-slate-300'}\`}>
                  <div className={\`absolute top-0 right-0 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-bl-xl \${isExpired ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}\`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-slate-100 p-3.5 rounded-xl"><Building2 className="w-6 h-6 text-slate-700" /></div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-900 leading-tight">{lib.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <User className="w-3.5 h-3.5" /> {lib.buyerName || 'No Buyer Name'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Mail className="w-4 h-4" /> <span className="text-sm font-medium">Username</span></div>
                        <span className="text-sm font-bold text-slate-900">{lib.adminEmail}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Lock className="w-4 h-4" /> <span className="text-sm font-medium">Password</span></div>
                        <span className="text-sm font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">{lib.adminPassword || '••••••••'}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Clock className="w-4 h-4" /> <span className="text-sm font-medium">Expires</span></div>
                        <span className={\`text-sm font-bold \${isExpired ? 'text-red-600' : 'text-emerald-600'}\`}>{endDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                    <Button variant="outline" className="flex-1 bg-white border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 1)}>
                      +1 Mnth
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 6)}>
                      +6 Mnth
                    </Button>
                    <Button variant="default" className="flex-1 bg-[var(--color-primary)] hover:bg-teal-700" onClick={() => openEditModal(lib)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
               <h2 className="text-xl font-bold text-white">{editingLib ? 'Edit Tenant Details' : 'Register New Tenant'}</h2>
               <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8 p-0">×</Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Library Details</h3>
                  <div className="space-y-2">
                    <Label>Library Branch Name <span className="text-red-500">*</span></Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Central City Library" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Authentication</h3>
                </div>
                <div className="space-y-2">
                  <Label>Admin Username / Email <span className="text-red-500">*</span></Label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@library.com" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password <span className="text-red-500">*</span></Label>
                  <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Enter password" />
                </div>

                <div className="md:col-span-2 space-y-4 mt-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Subscription & Billing</h3>
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Buyer / Contact Name</Label>
                  <Input value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Main St, City, Country" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveLibrary} className="bg-[var(--color-primary)] hover:bg-teal-700">
                {editingLib ? 'Save Changes' : 'Create Tenant'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
`

fs.writeFileSync('src/pages/superadmin.tsx', content);
