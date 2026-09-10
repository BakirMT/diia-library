import * as React from "react"
import { Search, CreditCard, User, AlertTriangle, Download, History, FileText, DownloadCloud, Banknote } from "lucide-react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Avatar } from "@/src/components/ui/avatar"
import { fetchMembers, updateMember, fetchFines, deleteFine, updateFine, addFine, addNotification } from "@/src/lib/db"
import { exportToCSV } from "@/src/lib/export"
import jsPDF from "jspdf"
import { useSettings } from "@/src/lib/SettingsContext"
import { useAuth } from "@/src/lib/AuthContext"
import { MemberDetailsModal } from "@/src/components/members/member-details-modal"

export default function Fines() {
  const { settings } = useSettings();
  const {  role , libraryId } = useAuth();
  
  const [allMembers, setAllMembers] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [allFines, setAllFines] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'outstanding' | 'history'>('outstanding');
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [payingFineMember, setPayingFineMember] = React.useState<{id: string, name: string, finesDue: number} | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');
  const [isPayingFine, setIsPayingFine] = React.useState(false);

  const [viewingMember, setViewingMember] = React.useState<any>(null);

  const loadData = () => {
    Promise.all([fetchMembers(), fetchFines()]).then(([fetchedMembers, fetchedFines]) => {
      setAllMembers(fetchedMembers);
      setMembers(fetchedMembers.filter(m => m.finesDue > 0));
      
      const finesWithNames = fetchedFines.map(f => {
        const m = fetchedMembers.find(mem => mem.id === f.memberId);
        return { 
          ...f, 
          memberName: m ? m.name : 'Unknown Member',
          currentFinesDue: m ? (m.finesDue || 0) : 0
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllFines(finesWithNames);
      setIsLoading(false);
    });
  };

  React.useEffect(() => {
    loadData();
  }, [libraryId]);
  
  const filteredHistory = allFines.filter(f => {
    if (!searchQuery) return true;
    return String(f.memberName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           String(f.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           String(f.status || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportCSV = () => {
    const exportData = filteredHistory.map(f => ({
      'Receipt ID': f.id,
      'Date': new Date(f.date).toLocaleDateString(),
      'Member Name': f.memberName,
      'Reason': f.reason || 'Fine',
      'Amount': `${settings.currencySymbol}${f.amount.toFixed(2)}`,
      'Status': f.status
    }));
    exportToCSV(exportData, 'fine_receipts_history');
  };

  const downloadReceipt = (fine: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('LIBRARY FINE RECEIPT', 105, 20, { align: 'center' });
    
    // Divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 25, 190, 25);
    
    // Receipt Details
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Receipt ID: ${fine.id.toUpperCase()}`, 20, 35);
    doc.text(`Date Issued: ${new Date(fine.date).toLocaleString()}`, 20, 42);
    doc.text(`Payment Date: ${fine.paymentDate ? new Date(fine.paymentDate).toLocaleString() : (fine.status === 'Paid' ? new Date().toLocaleString() : 'N/A')}`, 20, 49);
    
    // Member Details Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('MEMBER DETAILS', 20, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Name: ${fine.memberName}`, 20, 72);
    doc.text(`Member ID: ${fine.memberId}`, 20, 79);
    
    // Transaction Details Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('TRANSACTION DETAILS', 20, 95);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Description: ${fine.reason || 'Library Fine'}`, 20, 102);
    doc.text(`Payment Method: ${fine.paymentMethod || (fine.status === 'Paid' ? 'Cash' : 'N/A')}`, 20, 109);
    doc.text(`Status: ${fine.status.toUpperCase()}`, 20, 116);
    
    // Total Section
    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`REMAINING BALANCE: ${settings.currencySymbol}${fine.currentFinesDue?.toFixed(2) || '0.00'}`, 20, 135);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL PAID: ${settings.currencySymbol}${fine.amount.toFixed(2)}`, 190, 135, { align: 'right' });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Thank you for settling your library dues.', 105, 150, { align: 'center' });
    
    // Save PDF
    doc.save(`Receipt_${fine.id}.pdf`);
  };

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    return String(m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
           String(m.id || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePayFine = async () => {
    if (!payingFineMember || !paymentAmount) return;
    setIsPayingFine(true);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid payment amount");
      
      const newFinesDue = Math.max(0, payingFineMember.finesDue - amount);
      await updateMember(payingFineMember.id, { finesDue: newFinesDue });
      
      const fines = await fetchFines();
      const memberFines = fines.filter(f => f.memberId === payingFineMember.id && f.status === 'Unpaid');
      
      let remainingPayment = amount;
      for (const f of memberFines) {
        if (remainingPayment >= f.amount) {
           remainingPayment -= f.amount;
           await updateFine(f.id, { 
             status: 'Paid', 
             paymentMethod: paymentMethod, 
             paymentDate: new Date().toISOString() 
           });
        } else if (remainingPayment > 0) {
           await updateFine(f.id, { amount: f.amount - remainingPayment });
           await addFine({
             memberId: f.memberId,
             amount: remainingPayment,
             reason: f.reason ? f.reason + ' (Partial Payment)' : 'Partial Fine Payment',
             status: 'Paid',
             paymentMethod: paymentMethod,
             paymentDate: new Date().toISOString(),
             date: new Date().toISOString()
           });
           remainingPayment = 0;
        }
      }
      
      if (newFinesDue === 0) {
        const remainingFines = await fetchFines();
        const stillUnpaid = remainingFines.filter(f => f.memberId === payingFineMember.id && f.status === 'Unpaid');
        for (const f of stillUnpaid) {
           await updateFine(f.id, { 
             status: 'Paid',
             paymentMethod: paymentMethod, 
             paymentDate: new Date().toISOString() 
           });
        }
      }

      await addNotification({
        userId: payingFineMember.id,
        title: 'Fine Payment Received',
        message: `Successfully processed ${paymentMethod} payment of ${settings.currencySymbol}${amount.toFixed(2)}. Your remaining fine balance is ${settings.currencySymbol}${newFinesDue.toFixed(2)}.`,
        type: 'fine'
      });
      
      setPayingFineMember(null);
      setPaymentAmount('');
      setPaymentMethod('Cash');
      loadData();
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      alert("Failed to process payment: " + error.message);
    } finally {
      setIsPayingFine(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalOutstanding = members.reduce((sum, m) => sum + (m.finesDue || 0), 0);
  const totalCollected = allFines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {payingFineMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPayingFineMember(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Pay Fine</h3>
            <p className="text-sm text-slate-500">Member "{payingFineMember.name}" has an outstanding fine of <strong>{settings.currencySymbol}{payingFineMember.finesDue.toFixed(2)}</strong>.</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  variant={parseFloat(paymentAmount) === payingFineMember.finesDue ? "default" : "outline"} 
                  className={parseFloat(paymentAmount) === payingFineMember.finesDue ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" : "flex-1 text-slate-600"}
                  onClick={() => setPaymentAmount(payingFineMember.finesDue.toFixed(2))}
                >
                  Pay Full
                </Button>
                <Button 
                  variant={parseFloat(paymentAmount) !== payingFineMember.finesDue ? "default" : "outline"} 
                  className={parseFloat(paymentAmount) !== payingFineMember.finesDue ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" : "flex-1 text-slate-600"}
                  onClick={() => setPaymentAmount('')}
                >
                  Partial Pay
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Amount to Pay ({settings.currencySymbol})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{settings.currencySymbol}</span>
                  <Input 
                    type="number" 
                    min="0.01" 
                    max={payingFineMember.finesDue} 
                    step="0.01" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="pl-8"
                  />
                </div>
                {parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < payingFineMember.finesDue && (
                  <p className="text-xs text-amber-600 flex items-center mt-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Remaining balance will be {settings.currencySymbol}{(payingFineMember.finesDue - parseFloat(paymentAmount)).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                </select>
              </div>
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

      <MemberDetailsModal
        isOpen={!!viewingMember}
        member={viewingMember}
        onClose={() => setViewingMember(null)}
        onEdit={() => {}}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button 
            variant={activeTab === 'outstanding' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('outstanding')}
            className={activeTab === 'outstanding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
          >
            Outstanding Balances
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}
          >
            History & Receipts
          </Button>
        </div>
        {activeTab === 'history' && (
          <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto">
            <DownloadCloud className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fine Management</h2>
          <p className="text-sm text-slate-500">Process fine payments for members with outstanding balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-rose-50 uppercase tracking-wider">Total Outstanding</div>
                <div className="text-3xl font-bold">{settings.currencySymbol}{totalOutstanding.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-rose-50">Members with fines</span>
                <span className="font-bold bg-white/20 px-2 py-1 rounded-md">{members.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-emerald-50 uppercase tracking-wider">Total Collected</div>
                <div className="text-3xl font-bold">{settings.currencySymbol}{totalCollected.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-50">Total Paid Receipts</span>
                <span className="font-bold bg-white/20 px-2 py-1 rounded-md">{allFines.filter(f => f.status === 'Paid').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'outstanding' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm mb-4">
            <Input 
              placeholder="Search members by name or ID..." 
              icon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border-transparent focus-visible:bg-white"
            />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Member</th>
                    <th className="px-6 py-4 font-medium text-right">Fines Due</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                        {members.length === 0 ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                              <AlertTriangle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="font-medium text-slate-900">No outstanding fines</p>
                            <p className="text-xs mt-1">All members are clear.</p>
                          </div>
                        ) : (
                          "No members found matching your search."
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} onClick={() => setViewingMember(member)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={member.photoURL || undefined} fallback={member.fallback} />
                            <div>
                              <div className="font-semibold text-[var(--color-text-main)]">{member.name}</div>
                              <div className="text-xs text-[var(--color-text-muted)]">ID: {member.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          {settings.currencySymbol}{member.finesDue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayingFineMember({id: member.id, name: member.name, finesDue: member.finesDue});
                              setPaymentAmount(member.finesDue.toFixed(2));
                            }}
                          >
                            <CreditCard className="w-4 h-4 mr-2" /> Pay Fine
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm mb-4">
            <Input 
              placeholder="Search history by member name, reason, or status..." 
              icon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border-transparent focus-visible:bg-white"
            />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Member</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Method</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No fine history found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((fine) => (
                      <tr key={fine.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {new Date(fine.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {fine.memberName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {fine.reason || 'Fine'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {settings.currencySymbol}{fine.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs text-slate-500 font-medium">{fine.paymentMethod || (fine.status === 'Paid' ? 'Cash' : '-')}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${fine.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {fine.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-slate-600 h-8"
                            onClick={() => downloadReceipt(fine)}
                          >
                            <Download className="w-4 h-4 mr-2" /> Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
