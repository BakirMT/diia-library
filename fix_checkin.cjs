const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/circulation.tsx', 'utf8');
  
  const oldCode = `        await addFine({ memberId: selectedMemberId, memberName: selectedMember?.name || 'Unknown', reason: \`Overdue check-in: \${recordToReturn.book.title}\`, amount: fineCharged, date: new Date().toISOString(), status: 'Unpaid' });`;
  
  const newCode = `        await addFine({ memberId: selectedMemberId, memberName: selectedMember?.name || 'Unknown', reason: \`Overdue check-in: \${recordToReturn.book.title}\`, amount: fineCharged, date: new Date().toISOString(), status: 'Unpaid' });
        
        setReceiptData({
          memberName: selectedMember?.name || 'Unknown',
          memberEmail: selectedMember?.email || '',
          bookTitle: recordToReturn.book.title,
          amount: fineCharged,
          date: new Date().toLocaleDateString(),
          dueDate: new Date(recordToReturn.dueDate).toLocaleDateString(),
          returnDate: new Date().toLocaleDateString()
        });`;
        
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/pages/circulation.tsx', code);
}
fix();
