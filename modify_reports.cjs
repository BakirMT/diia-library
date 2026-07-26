const fs = require('fs');

let content = fs.readFileSync('src/pages/reports.tsx', 'utf-8');

// Replace reportType
content = content.replace(
  "const [reportType, setReportType] = React.useState<'overdue' | 'inventory' | 'fines'>('overdue');",
  "const [reportType, setReportType] = React.useState<'checkedout' | 'overdue' | 'inventory' | 'fines'>('checkedout');"
);

const checkedOutLogic = `
  const checkedOutBooksData = React.useMemo(() => {
    const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const bookStates = new Map<string, any>();
    
    sortedActivities.forEach(act => {
      const key = act.memberId + "::" + act.bookTitle;
      if (act.action === 'Check Out') {
        const coDate = new Date(act.date);
        const dDate = new Date(coDate);
        dDate.setDate(dDate.getDate() + 14);
        bookStates.set(key, {
          memberId: act.memberId,
          memberName: act.memberName,
          bookTitle: act.bookTitle,
          checkoutDate: coDate.toISOString().split('T')[0],
          dueDate: dDate.toISOString().split('T')[0],
          status: 'Active'
        });
      } else if (act.action === 'Renew') {
        const state = bookStates.get(key);
        if (state && state.status === 'Active') {
          const dDate = new Date(state.dueDate);
          dDate.setDate(dDate.getDate() + 7);
          state.dueDate = dDate.toISOString().split('T')[0];
        }
      } else if (act.action === 'Check In') {
        const state = bookStates.get(key);
        if (state) {
          state.status = 'Returned';
        }
      }
    });
    
    const activeLoans = Array.from(bookStates.values()).filter(state => state.status === 'Active');
    const today = new Date();
    
    return activeLoans.map(state => {
      const dueDate = new Date(state.dueDate);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      let fine = daysOverdue * settings.fineRate;
      if (fine > settings.maxFine) fine = settings.maxFine;
      
      return {
        ...state,
        daysOverdue,
        fineAmount: fine
      };
    });
  }, [activities, settings.fineRate, settings.maxFine]);

  const getCheckedOutBooks = () => checkedOutBooksData;

`;

content = content.replace(
  "const overdueBooksData = React.useMemo(() => {",
  checkedOutLogic + "  const overdueBooksData = React.useMemo(() => {"
);

// title replacement
content = content.replace(
  "if (reportType === 'overdue') title = \"Overdue Books Report\";",
  "if (reportType === 'checkedout') title = \"Checked Out Books Report\";\n    if (reportType === 'overdue') title = \"Overdue Books Report\";"
);

// Add checkedout in PDF body logic
const printLogic = `    if (reportType === 'checkedout') {
      head = [["SI No", "Student ID", "Name", "Book Name", "Checked Out From", "Days Overdue", \`Fine (\${settings.currencySymbol})\`]];
      body = getCheckedOutBooks().map((item, index) => [
        (index + 1).toString(),
        item.memberId || '',
        item.memberName || '',
        item.bookTitle || '',
        item.checkoutDate || '',
        item.daysOverdue > 0 ? \`\${item.daysOverdue} days\` : '-',
        item.fineAmount > 0 ? \`\${settings.currencySymbol}\${item.fineAmount.toFixed(2)}\` : '-'
      ]);
    } else if (reportType === 'overdue') {`;

content = content.replace(
  "if (reportType === 'overdue') {",
  printLogic
);

// Add button
const buttonsUI = `<Button 
          variant={reportType === 'checkedout' ? 'default' : 'outline'} 
          onClick={() => setReportType('checkedout')}
          className={reportType === 'checkedout' ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent' : ''}
        >
          <PackageOpen className="mr-2 h-4 w-4" /> Checked Out Books
        </Button>
        <Button`;

content = content.replace(
  "<Button \n          variant={reportType === 'overdue' ? 'default' : 'outline'}",
  buttonsUI
);

// Add Title in HTML
content = content.replace(
  "{reportType === 'overdue' && 'Overdue Books Report'}",
  "{reportType === 'checkedout' && 'Checked Out Books Report'}\n              {reportType === 'overdue' && 'Overdue Books Report'}"
);

// Add Table header for HTML
const tableHeader = `{reportType === 'checkedout' && (
                  <tr>
                    <th className="px-6 py-4 font-bold">SI No</th>
                    <th className="px-6 py-4 font-bold">Student ID</th>
                    <th className="px-6 py-4 font-bold">Name</th>
                    <th className="px-6 py-4 font-bold">Book Name</th>
                    <th className="px-6 py-4 font-bold">Checked Out From</th>
                    <th className="px-6 py-4 font-bold text-right">Days Overdue</th>
                    <th className="px-6 py-4 font-bold text-right">Fine ({settings.currencySymbol})</th>
                  </tr>
                )}
                {reportType === 'overdue' && (`;

content = content.replace(
  "{reportType === 'overdue' && (",
  tableHeader
);

// Add Table body for HTML
const tableBody = `{reportType === 'checkedout' && getCheckedOutBooks().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{i + 1}</td>
                    <td className="px-6 py-4 font-medium">{item.memberId}</td>
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4">{item.checkoutDate}</td>
                    <td className="px-6 py-4 text-right">
                      {item.daysOverdue > 0 ? (
                        <span className="text-red-600 font-medium">{item.daysOverdue} days</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {item.fineAmount > 0 ? (
                        <span className="text-red-600">{settings.currencySymbol}{item.fineAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reportType === 'overdue' && getOverdueBooks().map((item, i) => (`;

content = content.replace(
  "{reportType === 'overdue' && getOverdueBooks().map((item, i) => (",
  tableBody
);

fs.writeFileSync('src/pages/reports.tsx', content);
