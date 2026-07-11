import * as React from "react"
import { Plus, Search, Filter, Edit2, Trash2, Mail, Phone, Upload, Download, MessageSquare, CreditCard } from "lucide-react"
import { exportToCSV } from "@/src/lib/export"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Avatar } from "@/src/components/ui/avatar"
import { AddMemberModal } from "@/src/components/members/add-member-modal"
import { BulkImportModal } from "@/src/components/shared/bulk-import-modal"
import { useNavigate } from "react-router-dom"
import { fetchMembers, addMember, updateMember, deleteMember, fetchActivities, addNotification } from "@/src/lib/db"

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = React.useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<any>(null);
  const [deletingMember, setDeletingMember] = React.useState<{id: string, name: string} | null>(null);
  const [payingFineMember, setPayingFineMember] = React.useState<{id: string, name: string, finesDue: number} | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState<string>('');
  const [isPayingFine, setIsPayingFine] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('All');
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);

  React.useEffect(() => {
    fetchMembers().then(fetchedMembers => {
      setMembers(fetchedMembers);
      setIsLoading(false);
    });
  }, []);

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchQuery || 
      String(m.name || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) || 
      String(m.email || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) || String(m.username || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
      String(m.id || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
      
    const matchesType = selectedType === 'All' || m.membershipType === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handlePayFine = async () => {
    if (!payingFineMember || !paymentAmount) return;
    setIsPayingFine(true);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid payment amount");
      
      const newFinesDue = Math.max(0, payingFineMember.finesDue - amount);
      await updateMember(payingFineMember.id, { finesDue: newFinesDue });
      
      await addNotification({
        userId: payingFineMember.id,
        title: 'Fine Payment Received',
        message: `Successfully processed fine payment of $${amount.toFixed(2)}. Your remaining fine balance is $${newFinesDue.toFixed(2)}.`,
        type: 'fine'
      });
      
      setMembers(members.map(m => m.id === payingFineMember.id ? { ...m, finesDue: newFinesDue } : m));
      setPayingFineMember(null);
      setPaymentAmount('');
    } catch (err: any) {
      alert("Failed to process payment: " + err.message);
    } finally {
      setIsPayingFine(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingMember) {
      try {
        await deleteMember(deletingMember.id);
        setMembers(prev => prev.filter(member => String(member.id) !== String(deletingMember.id)));
        setDeletingMember(null);
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(filteredMembers.map(m => m.id));
    }
  };

  const toggleSelectMember = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedMemberIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const id of selectedMemberIds) {
        await deleteMember(id);
      }
      setMembers(prev => prev.filter(m => !selectedMemberIds.includes(String(m.id))));
      setSelectedMemberIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (e: any) {
      alert("Failed to delete some members: " + e.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const [exportStatus, setExportStatus] = React.useState('');

  const handleExport = () => {
    const dataToExport = filteredMembers.map(member => ({
      'Photo URL': member.photoUrl || member.photo || '',
      'Full Name': member.name || '',
      'Gender': member.gender || '',
      'Date of Birth': member.dob || '',
      'Email Address': member.email || '',
      'Phone Number': member.phone || '',
      'Full Address': member.address || '',
      'Membership ID': member.id || '',
      'Type / Tier': member.membershipType || '',
      'Registration Fee': member.fee || '',
      'Class': member.studentClass || '',
      'Expiry Date': member.expiryDate || '',
      'Status': member.status || ''
    }));
    
    const success = exportToCSV(dataToExport, "library_members_export.csv");
    if (success) {
      setExportStatus('Export successful! (If it did not download, open app in a new tab)');
    } else {
      setExportStatus('Export failed. Please check browser permissions.');
    }
    setTimeout(() => setExportStatus(''), 6000);
  };

  return (
    <div className="space-y-6">
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingMember(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete member "{deletingMember.name}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingMember(null)}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteConfirm}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Bulk Deletion</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete {selectedMemberIds.length} selected members? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)} disabled={isBulkDeleting}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleBulkDeleteConfirm} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {payingFineMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPayingFineMember(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Pay Fine</h3>
            <p className="text-sm text-slate-500">Member "{payingFineMember.name}" has an outstanding fine of <strong>${payingFineMember.finesDue.toFixed(2)}</strong>.</p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount ($)</label>
              <Input 
                type="number" 
                min="0.01" 
                max={payingFineMember.finesDue} 
                step="0.01" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                placeholder="0.00" 
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setPayingFineMember(null)} disabled={isPayingFine}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePayFine} disabled={isPayingFine || !paymentAmount}>
                {isPayingFine ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type="members"
        onImport={async (data) => {
          try {
            const newMembers = [];
            for (const d of data) {
              const name = d.name || d.Name || d['Full Name'];
              if (!name || name.trim() === '') continue; // Skip blank members
              
              const newMember = {
                id: d.id || d.ID || d['Membership ID'],
                name: name,
                username: d.username || d.Username || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                email: d.email || d.Email || d['Email Address'] || '',
                phone: d.phone || d.Phone || d['Phone Number'] || '',
                membershipType: d.membershipType || d['Membership Type'] || d['Type / Tier'] || 'Member',
                joinDate: d.joinDate || d['Registration Date'] || new Date().toISOString(),
                studentClass: d.studentClass || d.Class || 'N/A',
                booksBorrowed: Number(d.booksBorrowed || d['Books Checked Out']) || 0,
                finesDue: Number(d.finesDue || d['Fines Due']) || 0,
                status: d.status || d.Status || 'Active',
                fallback: d.fallback || name.substring(0, 2).toUpperCase(),
                photoURL: d.photoURL || d['Photo URL'] || '',
                gender: d.gender || d.Gender || '',
                dateOfBirth: d.dateOfBirth || d['Date of Birth'] || '',
                fullAddress: d.fullAddress || d['Full Address'] || '',
                expiryDate: d.expiryDate || d['Expiry Date'] || ''
              };
              // Remove undefined
              Object.keys(newMember).forEach((key) => {
                if (newMember[key as keyof typeof newMember] === undefined) {
                  delete newMember[key as keyof typeof newMember];
                }
              });
              const saved = await addMember(newMember);
              newMembers.push(saved);
            }
            setMembers([...newMembers, ...members]);
          } catch (error: any) {
            console.error("Failed to import members:", error);
            alert("Failed to import members: " + error.message);
          }
        }}
      />
      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        onSave={async (memberData) => {
          try {
            const newMember = { 
              ...memberData, 
              id: memberData.id, 
              studentClass: memberData.studentClass || 'N/A', 
              booksBorrowed: 0, 
              finesDue: 0,
              fallback: memberData.name ? memberData.name.substring(0, 2).toUpperCase() : 'NA' 
            };
            // Remove undefined values
            Object.keys(newMember).forEach(key => newMember[key] === undefined && delete newMember[key]);
            
            const savedMember = await addMember(newMember);
            setMembers([savedMember, ...members]);
            setIsAddMemberModalOpen(false);
          } catch (error: any) {
            console.error("Failed to save member:", error);
            alert("Failed to save member: " + error.message);
          }
        }}
      />
      <AddMemberModal 
        isOpen={!!editingMember} 
        onClose={() => setEditingMember(null)} 
        initialData={editingMember}
        onSave={async (memberData) => {
          try {
            // Remove undefined values
            Object.keys(memberData).forEach(key => memberData[key] === undefined && delete memberData[key]);
            
            if (editingMember.id !== memberData.id && memberData.id) {
              await addMember(memberData);
              await deleteMember(editingMember.id);
            } else {
              await updateMember(editingMember.id, memberData);
            }
            setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...memberData } : m));
            setEditingMember(null);
          } catch (error: any) {
            console.error("Failed to update member:", error);
            alert("Failed to update member: " + error.message);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Members Management</h2>
          <p className="text-sm text-slate-500">View and manage library member accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {selectedMemberIds.length > 0 && (
            <Button variant="destructive" onClick={() => setIsBulkDeleteModalOpen(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedMemberIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto text-slate-600">
            <Download className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setIsAddMemberModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>
      
      {exportStatus && (
        <div className={`p-3 rounded-md text-sm ${String(exportStatus || '').includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {exportStatus}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <Input 
            placeholder="Search members by name, email, or ID..." 
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-50 border-transparent focus-visible:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex h-10 w-full sm:w-48 rounded-full bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200"
          >
            <option value="All">All Types</option>
            <option value="Member">Member</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Username</th>
                <th className="px-6 py-4 font-medium">Contact Info</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Class</th>
                <th className="px-6 py-4 font-medium">Checked Out</th>
                <th className="px-6 py-4 font-medium text-right">Fines Due</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredMembers.map((member) => (
                <tr key={member.id} onClick={() => setEditingMember(member)} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedMemberIds.includes(member.id) ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedMemberIds.includes(member.id)}
                      onChange={() => toggleSelectMember(member.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={member.photoURL || undefined} fallback={member.fallback} />
                      <div>
                        <div className="font-semibold text-[var(--color-text-main)]">{member.name}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">ID: {member.id}</div>
                      </div>
                    </div>
                  </td>
                        <td className="px-6 py-4 hidden md:table-cell text-slate-500">{member.username || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-[var(--color-text-muted)]">
                        <Mail className="mr-2 h-3 w-3" /> {member.email}
                      </div>
                      <div className="flex items-center text-xs text-[var(--color-text-muted)]">
                        <Phone className="mr-2 h-3 w-3" /> {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-slate-50 text-[var(--color-navy)] border-slate-200">
                      {member.membershipType}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] whitespace-nowrap">
                    {member.studentClass}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-main)] font-medium">
                    {member.booksBorrowed}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {member.finesDue > 0 ? (
                      <span className="text-red-600">${Number(member.finesDue).toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-400">$0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        member.status === 'Active' ? 'success' : 
                        member.status === 'Suspended' ? 'destructive' : 'secondary'
                      }
                    >
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {member.finesDue > 0 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={(e) => {
                          e.stopPropagation();
                          setPayingFineMember({id: member.id, name: member.name, finesDue: member.finesDue});
                          setPaymentAmount(member.finesDue.toFixed(2));
                        }} title="Pay Fine">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {member.status === 'Active' && member.password && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50" onClick={(e) => { e.stopPropagation(); navigate(`/inbox?memberId=${member.id}`); }} title="Message Member">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setEditingMember(member); }} title="Edit Member">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeletingMember({id: member.id, name: member.name}); }} title="Delete Member">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <div>Showing 1 to {filteredMembers.length} of {filteredMembers.length} entries</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
