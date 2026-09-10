const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/circulation.tsx', 'utf8');
  
  const functionsToAdd = `
  const handlePrintReceipt = (receipt: any) => {
    const doc = new jsPDF();
    const safeCurrency = settings.currencySymbol === "₹" ? "Rs." : (settings.currencySymbol === "€" ? "EUR " : (settings.currencySymbol === "£" ? "GBP " : settings.currencySymbol));
    
    doc.setFontSize(20);
    doc.text(settings.libraryName || "Library Management System", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("Fine Receipt", 105, 30, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(\`Date: \${new Date().toLocaleDateString()}\`, 14, 45);
    doc.text(\`Member Name: \${receipt.memberName}\`, 14, 55);
    doc.text(\`Member Email: \${receipt.memberEmail}\`, 14, 65);
    
    autoTable(doc, {
      startY: 75,
      head: [['Description', 'Due Date', 'Return Date', 'Amount']],
      body: [
        [
          \`Overdue: \${receipt.bookTitle}\`,
          receipt.dueDate,
          receipt.returnDate,
          \`\${safeCurrency}\${receipt.amount.toFixed(2)}\`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: 0, fontStyle: 'bold' }
    });
    
    doc.save(\`Fine_Receipt_\${receipt.memberName.replace(/\\s+/g, '_')}_\${Date.now()}.pdf\`);
  };

  const handleEmailReceipt = () => {
    if (!receiptData) return;
    const safeCurrency = settings.currencySymbol;
    const subject = encodeURIComponent("Library Fine Receipt");
    const body = encodeURIComponent(\`Hello \${receiptData.memberName},\\n\\nThis is a receipt for the fine generated on your account.\\n\\nBook: \${receiptData.bookTitle}\\nDue Date: \${receiptData.dueDate}\\nReturn Date: \${receiptData.returnDate}\\nFine Amount: \${safeCurrency}\${receiptData.amount.toFixed(2)}\\n\\nPlease ensure this fine is paid at your earliest convenience.\\n\\nThank you,\\n\${settings.libraryName || "Library Management System"}\`);
    window.location.href = \`mailto:\${receiptData.memberEmail}?subject=\${subject}&body=\${body}\`;
  };

  return (
`;

  code = code.replace('  return (', functionsToAdd);
  
  const modalToAdd = `
      {receiptData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Fine Generated</h3>
              <Button variant="ghost" size="icon" onClick={() => setReceiptData(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Overdue Fine</h4>
                <p className="text-sm text-slate-500">A fine has been added to the member's account.</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-medium text-slate-900">{receiptData.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Book:</span>
                  <span className="font-medium text-slate-900">{receiptData.bookTitle}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 mt-3">
                  <span className="font-medium text-slate-700">Total Fine:</span>
                  <span className="font-bold text-red-600">{settings.currencySymbol}{receiptData.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" variant="outline" onClick={handleEmailReceipt}>
                  <Mail className="mr-2 h-4 w-4" /> Email Receipt
                </Button>
                <Button className="flex-1" onClick={() => handlePrintReceipt(receiptData)}>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`;

  code = code.replace(/    <\/div>\n  \)\n}\s*$/, modalToAdd);

  fs.writeFileSync('src/pages/circulation.tsx', code);
}
fix();
