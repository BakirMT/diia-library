const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/reports.tsx', 'utf8');
  
  // Add Status to table head for fines
  code = code.replace(
    `                {reportType === 'fines' && (
                  <tr>
                    <th className="px-6 py-4 font-medium">Member Name</th>
                    <th className="px-6 py-4 font-medium">Book Title</th>
                    <th className="px-6 py-4 font-medium">Due Date</th>
                    <th className="px-6 py-4 font-medium text-right">Fine Amount</th>
                  </tr>
                )}`,
    `                {reportType === 'fines' && (
                  <tr>
                    <th className="px-6 py-4 font-medium">Member Name</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Fine Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                  </tr>
                )}`
  );
  
  // Add status column to body
  const oldBody = `                {reportType === 'fines' && getFinesReport().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{settings.currencySymbol}{item.fineAmount.toFixed(2)}</td>
                  </tr>
                ))}`;
                
  const newBody = `                {reportType === 'fines' && getFinesReport().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{settings.currencySymbol}{item.fineAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={\`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}`;
  
  code = code.replace(oldBody, newBody);
  
  fs.writeFileSync('src/pages/reports.tsx', code);
}
fix();
