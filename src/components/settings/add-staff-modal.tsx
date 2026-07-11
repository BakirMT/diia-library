
import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Omit<StaffMember, 'id'>) => void;
  initialData?: StaffMember | null;
}

export function AddStaffModal({ isOpen, onClose, onSave, initialData }: AddStaffModalProps) {
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Librarian');
  const [status, setStatus] = React.useState<'Active'|'Inactive'>('Active');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name);
      setUsername(initialData.username || '');
      setEmail(initialData.email);
      setRole(initialData.role);
      setStatus(initialData.status);
      setPassword('');
    } else if (isOpen) {
      setName('');
      setUsername('');
      setEmail('');
      setRole('Librarian');
      setStatus('Active');
      setPassword('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name || !username || !email) return;
    onSave({ name, username, email, role, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Username <span className="text-red-500">*</span></label>
              <Input placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
              <Input placeholder="Enter staff's full name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address <span className="text-red-500">*</span></label>
              <Input type="email" placeholder="staff@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Role / Access Level <span className="text-red-500">*</span></label>
              <select value={role} onChange={e => setRole(e.target.value)} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                <option value="Admin">Admin</option>
                <option value="Librarian">Librarian</option>
                <option value="Assistant">Assistant</option>
              </select>
            </div>
            {!initialData && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Temporary Password <span className="text-red-500">*</span></label>
                <Input type="password" placeholder="Create an initial password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} className="rounded-full px-6">Save Staff</Button>
        </div>
      </div>
    </div>
  )
}
