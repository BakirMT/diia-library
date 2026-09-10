const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/circulation.tsx', 'utf8');

  // Replace occurrences of the functions
  const handlePrintRegex = /\s*const handlePrintReceipt = \(receipt: any\) => \{[\s\S]*?doc\.save\(\`Fine_Receipt_\$\{receipt\.memberName\.replace\(\/\\s\+\/g, '_'\)\}_\$\{Date\.now\(\)\}\.pdf\`\);\s*\};\s*const handleEmailReceipt = \(\) => \{[\s\S]*?window\.location\.href = \`mailto:\$\{receiptData\.memberEmail\}\?subject=\$\{subject\}&body=\$\{body\}\`;\s*\};\s*/g;
  
  code = code.replace(handlePrintRegex, '\n');
  
  // Find the FIRST `return (\n    <div className="space-y-6">`
  const returnStr = '  return (\n    <div className="space-y-6">';
  const returnIdx = code.indexOf(returnStr);
  
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

`;
  
  if (returnIdx !== -1) {
    code = code.substring(0, returnIdx) + functionsToAdd + code.substring(returnIdx);
    console.log("Replaced successfully!");
  } else {
    console.log("Could not find return statement");
  }

  fs.writeFileSync('src/pages/circulation.tsx', code);
}
fix();
