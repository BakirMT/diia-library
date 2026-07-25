import * as React from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StaffMember, 'id'>) => void;
  initialData: StaffMember | null;
}

export function AddStaffModal({ isOpen, onClose, onSave, initialData }: AddStaffModalProps) {
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Librarian');
  const [status, setStatus] = React.useState('Active');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUsername(initialData.username);
      setEmail(initialData.email);
      setRole(initialData.role);
      setStatus(initialData.status);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setRole('Librarian');
      setStatus('Active');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Staff' : 'Add Staff'}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-10 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="Admin">Admin</option>
              <option value="Librarian">Librarian</option>
              <option value="Assistant">Assistant</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onSave({ name, username, email, role, status });
            onClose();
          }}>Save</Button>
        </div>
      </div>
    </div>
  );
}
