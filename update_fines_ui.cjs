const fs = require('fs');
let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

// 1. Add Banknote icon import
if (!content.includes('Banknote')) {
    content = content.replace(
      'import { Search, CreditCard, User, AlertTriangle, Download, History, FileText, DownloadCloud } from "lucide-react"',
      'import { Search, CreditCard, User, AlertTriangle, Download, History, FileText, DownloadCloud, Banknote } from "lucide-react"'
    );
}

// 2. Update state to keep all members
content = content.replace(
  'const [members, setMembers] = React.useState<any[]>([]);',
  `const [allMembers, setAllMembers] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);`
);

// 3. Update loadData to attach currentFinesDue and keep allMembers
content = content.replace(
  `setMembers(fetchedMembers.filter(m => m.finesDue > 0));
      
      const finesWithNames = fetchedFines.map(f => {
        const m = fetchedMembers.find(mem => mem.id === f.memberId);
        return { ...f, memberName: m ? m.name : 'Unknown Member' };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());`,
  `setAllMembers(fetchedMembers);
      setMembers(fetchedMembers.filter(m => m.finesDue > 0));
      
      const finesWithNames = fetchedFines.map(f => {
        const m = fetchedMembers.find(mem => mem.id === f.memberId);
        return { 
          ...f, 
          memberName: m ? m.name : 'Unknown Member',
          currentFinesDue: m ? (m.finesDue || 0) : 0
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());`
);

// 4. Update downloadReceipt to show outstanding balance and update Total formatting
content = content.replace(
  `doc.text(\`Status: \${fine.status.toUpperCase()}\`, 20, 116);
    
    // Total Section
    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(\`TOTAL: \${settings.currencySymbol}\${fine.amount.toFixed(2)}\`, 190, 135, { align: 'right' });`,
  `doc.text(\`Status: \${fine.status.toUpperCase()}\`, 20, 116);
    
    // Total Section
    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(\`REMAINING BALANCE: \${settings.currencySymbol}\${fine.currentFinesDue?.toFixed(2) || '0.00'}\`, 20, 135);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(\`TOTAL PAID: \${settings.currencySymbol}\${fine.amount.toFixed(2)}\`, 190, 135, { align: 'right' });`
);

// 5. Update metrics variables
content = content.replace(
  'const totalOutstanding = members.reduce((sum, m) => sum + (m.finesDue || 0), 0);',
  `const totalOutstanding = members.reduce((sum, m) => sum + (m.finesDue || 0), 0);
  const totalCollected = allFines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (f.amount || 0), 0);`
);

// 6. Refactor the UI layout
// Replace from start of outstanding tab logic to the start of the table
const newLayout = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            <div className="overflow-x-auto">`;

const layoutRegex = /\{activeTab === 'outstanding' \? \([\s\S]*?<div className="overflow-x-auto">/;
content = content.replace(layoutRegex, newLayout);

fs.writeFileSync('src/pages/fines.tsx', content);
