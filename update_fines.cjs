const fs = require('fs');
let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

// 1. Update imports
content = content.replace(
  'import { Search, CreditCard, User, AlertTriangle } from "lucide-react"',
  'import { Search, CreditCard, User, AlertTriangle, Download, History, FileText, DownloadCloud } from "lucide-react"'
);
content = content.replace(
  'import { fetchMembers, updateMember, fetchFines, deleteFine, updateFine, addNotification } from "@/src/lib/db"',
  'import { fetchMembers, updateMember, fetchFines, deleteFine, updateFine, addFine, addNotification } from "@/src/lib/db"\nimport { exportToCSV } from "@/src/lib/export"'
);

// 2. Add state inside Fines()
content = content.replace(
  'const [members, setMembers] = React.useState<any[]>([]);',
  `const [members, setMembers] = React.useState<any[]>([]);
  const [allFines, setAllFines] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'outstanding' | 'history'>('outstanding');`
);

// 3. Update useEffect and loadData
content = content.replace(
  /React\.useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  `const loadData = () => {
    Promise.all([fetchMembers(), fetchFines()]).then(([fetchedMembers, fetchedFines]) => {
      setMembers(fetchedMembers.filter(m => m.finesDue > 0));
      
      const finesWithNames = fetchedFines.map(f => {
        const m = fetchedMembers.find(mem => mem.id === f.memberId);
        return { ...f, memberName: m ? m.name : 'Unknown Member' };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllFines(finesWithNames);
      setIsLoading(false);
    });
  };

  React.useEffect(() => {
    loadData();
  }, []);
  
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
      'Amount': \`\${settings.currencySymbol}\${f.amount.toFixed(2)}\`,
      'Status': f.status
    }));
    exportToCSV(exportData, 'fine_receipts_history');
  };

  const downloadReceipt = (fine: any) => {
    const content = \`
=========================================
          LIBRARY FINE RECEIPT          
=========================================
Receipt ID: \${fine.id}
Date: \${new Date(fine.date).toLocaleString()}
Member: \${fine.memberName}

Description:
\${fine.reason || 'Library Fine'}

-----------------------------------------
Amount: \${settings.currencySymbol}\${fine.amount.toFixed(2)}
Status: \${fine.status.toUpperCase()}
=========================================
\`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Receipt_\${fine.id}.txt\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };`
);

// 4. Update handlePayFine
content = content.replace(
  /const handlePayFine = async \(\) => \{[\s\S]*?\}\n  \};/,
  `const handlePayFine = async () => {
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
           await updateFine(f.id, { status: 'Paid' });
        } else if (remainingPayment > 0) {
           await updateFine(f.id, { amount: f.amount - remainingPayment });
           await addFine({
             memberId: f.memberId,
             amount: remainingPayment,
             reason: f.reason ? f.reason + ' (Partial Payment)' : 'Partial Fine Payment',
             status: 'Paid',
             date: new Date().toISOString()
           });
           remainingPayment = 0;
        }
      }
      
      if (newFinesDue === 0) {
        const remainingFines = await fetchFines();
        const stillUnpaid = remainingFines.filter(f => f.memberId === payingFineMember.id && f.status === 'Unpaid');
        for (const f of stillUnpaid) {
           await updateFine(f.id, { status: 'Paid' });
        }
      }

      await addNotification({
        userId: payingFineMember.id,
        title: 'Fine Payment Received',
        message: \`Successfully processed fine payment of \${settings.currencySymbol}\${amount.toFixed(2)}. Your remaining fine balance is \${settings.currencySymbol}\${newFinesDue.toFixed(2)}.\`,
        type: 'fine'
      });
      
      setPayingFineMember(null);
      setPaymentAmount('');
      loadData(); // Refresh all data to update history
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      alert("Failed to process payment: " + error.message);
    } finally {
      setIsPayingFine(false);
    }
  };`
);

// 5. Update tabs UI (above the grid)
content = content.replace(
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">',
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">`
);

// 6. Conditionally render grid/history based on activeTab
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
  `{activeTab === 'outstanding' ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`
);

content = content.replace(
  '            </div>\n          </Card>\n        </div>\n      </div>\n    </div>\n  )\n}',
  `            </div>
          </Card>
        </div>
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
                          <span className={\`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider \${fine.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
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
}`
);

fs.writeFileSync('src/pages/fines.tsx', content);
