const fs = require('fs');

let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

// 1. Add jsPDF import
if (!content.includes("import jsPDF from 'jspdf'")) {
    content = content.replace(
      'import { exportToCSV } from "@/src/lib/export"',
      'import { exportToCSV } from "@/src/lib/export"\nimport jsPDF from "jspdf"'
    );
}

// 2. Replace downloadReceipt function
const newReceiptFunc = `const downloadReceipt = (fine: any) => {
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
    doc.text(\`Receipt ID: \${fine.id.toUpperCase()}\`, 20, 35);
    doc.text(\`Date Issued: \${new Date(fine.date).toLocaleString()}\`, 20, 42);
    doc.text(\`Payment Date: \${fine.paymentDate ? new Date(fine.paymentDate).toLocaleString() : (fine.status === 'Paid' ? new Date().toLocaleString() : 'N/A')}\`, 20, 49);
    
    // Member Details Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('MEMBER DETAILS', 20, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(\`Name: \${fine.memberName}\`, 20, 72);
    doc.text(\`Member ID: \${fine.memberId}\`, 20, 79);
    
    // Transaction Details Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('TRANSACTION DETAILS', 20, 95);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(\`Description: \${fine.reason || 'Library Fine'}\`, 20, 102);
    doc.text(\`Payment Method: \${fine.paymentMethod || (fine.status === 'Paid' ? 'Cash' : 'N/A')}\`, 20, 109);
    doc.text(\`Status: \${fine.status.toUpperCase()}\`, 20, 116);
    
    // Total Section
    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(\`TOTAL: \${settings.currencySymbol}\${fine.amount.toFixed(2)}\`, 190, 135, { align: 'right' });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Thank you for settling your library dues.', 105, 150, { align: 'center' });
    
    // Save PDF
    doc.save(\`Receipt_\${fine.id}.pdf\`);
  };`;

content = content.replace(
  /const downloadReceipt = \(fine: any\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n  \};/,
  newReceiptFunc
);

fs.writeFileSync('src/pages/fines.tsx', content);
