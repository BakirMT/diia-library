const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/members.tsx', 'utf8');
  
  const paymentLogic = `      const newFinesDue = Math.max(0, payingFineMember.finesDue - amount);
      await updateMember(payingFineMember.id, { finesDue: newFinesDue });
      
      const allFines = await fetchFines();
      const memberFines = allFines.filter(f => f.memberId === payingFineMember.id && f.status === 'Unpaid');
      // Simple logic: if fully paid, mark all as paid
      if (newFinesDue === 0) {
        for (const f of memberFines) {
           await updateFine(f.id, { status: 'Paid' });
        }
      }
`;
  
  code = code.replace(
    'const newFinesDue = Math.max(0, payingFineMember.finesDue - amount);\n      await updateMember(payingFineMember.id, { finesDue: newFinesDue });',
    paymentLogic
  );
  
  fs.writeFileSync('src/pages/members.tsx', code);
}
fix();
