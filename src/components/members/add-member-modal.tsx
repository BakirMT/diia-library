import * as React from "react"
import { X, Upload, Camera } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (memberData: any) => void;
  initialData?: any;
}

export function AddMemberModal({ isOpen, onClose, onSave, initialData }: AddMemberModalProps) {
  const [formData, setFormData] = React.useState({
    id: '', photoUrl: '',
    name: '', username: '', gender: '', dob: '', email: '', phone: '', address: '', membershipType: 'Member', fee: '', studentClass: '', expiryDate: '', status: 'Active'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    } else {
      setFormData({ id: '', name: '', username: '', gender: '', dob: '', email: '', phone: '', address: '', membershipType: 'Member', fee: '', studentClass: '', expiryDate: '', status: 'Active', photoUrl: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? 'Edit Member' : 'Add New Member'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
          <form className="space-y-8">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Basic Information</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-24 h-24 bg-slate-100 rounded-full border border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden shrink-0">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-medium text-center px-2">No Photo</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Photo URL</label>
                    <Input value={formData.photoUrl || ''} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} placeholder="https://example.com/photo.jpg" type="url" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter member's full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Date of Birth</label>
                    <Input value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} type="date" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address <span className="text-red-500">*</span></label>
                  <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number <span className="text-red-500">*</span></label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} type="tel" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Address</label>
                  <textarea 
                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="flex w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm text-[var(--color-text-main)] outline-none transition-colors placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200 min-h-[80px] resize-y" 
                    placeholder="Enter street address, city, state, zip..."
                  />
                </div>
              </div>
            </div>

            {/* Membership Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Membership Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Membership ID <span className="text-red-500">*</span></label>
                  <Input value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="Enter Membership ID" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Type / Tier <span className="text-red-500">*</span></label>
                  <select value={formData.membershipType} onChange={e => setFormData({ ...formData, membershipType: e.target.value })} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                    <option value="Member">Member</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Registration Fee</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <Input value={formData.fee} onChange={e => setFormData({ ...formData, fee: e.target.value })} type="number" step="0.01" placeholder="0.00" className="pl-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Class</label>
                  <Input value={(formData as any).studentClass || ''} onChange={e => setFormData({ ...formData, studentClass: e.target.value })} placeholder="e.g. 10A" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Expiry Date</label>
                  <Input value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={() => { 
            if (!formData.name || !formData.email || !formData.membershipType || !formData.id) {
              alert('Please fill out all required fields: Membership ID, Full Name, Email Address, and Type / Tier.');
              return;
            }
            if (onSave) onSave(formData); 
            else onClose(); 
          }} className="rounded-full px-6">{initialData ? 'Update Member' : 'Save Member'}</Button>
        </div>
      </div>
    </div>
  )
}
