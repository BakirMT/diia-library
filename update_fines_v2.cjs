const fs = require('fs');

let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

// 1. Add state for paymentMethod
content = content.replace(
  'const [paymentAmount, setPaymentAmount] = React.useState<string>(\'\');',
  `const [paymentAmount, setPaymentAmount] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');`
);

// 2. Update receipt function
content = content.replace(
  /const downloadReceipt = \(fine: any\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n  \};/,
  `const downloadReceipt = (fine: any) => {
    const content = \`
=========================================
          LIBRARY FINE RECEIPT          
=========================================
Receipt ID: \${fine.id.toUpperCase()}
Date Issued: \${new Date(fine.date).toLocaleString()}
Payment Date: \${fine.paymentDate ? new Date(fine.paymentDate).toLocaleString() : new Date().toLocaleString()}
-----------------------------------------
MEMBER DETAILS
Name: \${fine.memberName}
Member ID: \${fine.memberId}
-----------------------------------------
TRANSACTION DETAILS
Description: \${fine.reason || 'Library Fine'}
Payment Method: \${fine.paymentMethod || 'N/A'}
Status: \${fine.status.toUpperCase()}
-----------------------------------------
TOTAL PAID: \${settings.currencySymbol}\${fine.amount.toFixed(2)}
=========================================
Thank you for settling your library dues!
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

// 3. Update handlePayFine to include paymentMethod
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
        message: \`Successfully processed \${paymentMethod} payment of \${settings.currencySymbol}\${amount.toFixed(2)}. Your remaining fine balance is \${settings.currencySymbol}\${newFinesDue.toFixed(2)}.\`,
        type: 'fine'
      });
      
      setPayingFineMember(null);
      setPaymentAmount('');
      setPaymentMethod('Cash');
      loadData(); // Refresh all data to update history
    } catch (error: any) {
      console.error("Failed to process payment:", error);
      alert("Failed to process payment: " + error.message);
    } finally {
      setIsPayingFine(false);
    }
  };`
);

// 4. Update the Pay Fine Modal UI
content = content.replace(
  '<div className="space-y-2">\n              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount ({settings.currencySymbol})</label>',
  `<div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Amount ({settings.currencySymbol})</label>
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>`
);
// Make sure we remove the original Input so we don't have it twice. Wait, the original regex replaced the start of it. Let's make sure we consume the whole block.
// Actually, it's safer to just replace the whole modal form structure.

content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

const oldModalRegex = /<div className="space-y-2">[\s\S]*?<label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount \(\{settings\.currencySymbol\}\)<\/label>[\s\S]*?<Input[\s\S]*?\/>[\s\S]*?<\/div>/;

const newModalUI = `<div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount ({settings.currencySymbol})</label>
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>`;

content = content.replace(oldModalRegex, newModalUI);

// 1. Add state for paymentMethod
content = content.replace(
  'const [paymentAmount, setPaymentAmount] = React.useState<string>(\'\');',
  `const [paymentAmount, setPaymentAmount] = React.useState<string>('');
  const [paymentMethod, setPaymentMethod] = React.useState('Cash');`
);

// 2. Update receipt function
content = content.replace(
  /const downloadReceipt = \(fine: any\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n  \};/,
  `const downloadReceipt = (fine: any) => {
    const content = \`
=========================================
          LIBRARY FINE RECEIPT          
=========================================
Receipt ID: \${fine.id.toUpperCase()}
Date Issued: \${new Date(fine.date).toLocaleString()}
Payment Date: \${fine.paymentDate ? new Date(fine.paymentDate).toLocaleString() : (fine.status === 'Paid' ? new Date().toLocaleString() : 'N/A')}
-----------------------------------------
MEMBER DETAILS
Name: \${fine.memberName}
Member ID: \${fine.memberId}
-----------------------------------------
TRANSACTION DETAILS
Description: \${fine.reason || 'Library Fine'}
Payment Method: \${fine.paymentMethod || (fine.status === 'Paid' ? 'Cash' : 'N/A')}
Status: \${fine.status.toUpperCase()}
-----------------------------------------
TOTAL PAID: \${settings.currencySymbol}\${fine.amount.toFixed(2)}
=========================================
Thank you for settling your library dues!
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

// 3. Update handlePayFine to include paymentMethod
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
        message: \`Successfully processed \${paymentMethod} payment of \${settings.currencySymbol}\${amount.toFixed(2)}. Your remaining fine balance is \${settings.currencySymbol}\${newFinesDue.toFixed(2)}.\`,
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
  };`
);

// 4. Update table headers in History view
content = content.replace(
  '<th className="px-6 py-4 font-medium text-right">Amount</th>',
  `<th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Method</th>`
);

// 5. Update table rows in History view
content = content.replace(
  '<td className="px-6 py-4 text-center">',
  `<td className="px-6 py-4 text-center">
                          <span className="text-xs text-slate-500 font-medium">{fine.paymentMethod || (fine.status === 'Paid' ? 'Cash' : '-')}</span>
                        </td>
                        <td className="px-6 py-4 text-center">`
);

fs.writeFileSync('src/pages/fines.tsx', content);
