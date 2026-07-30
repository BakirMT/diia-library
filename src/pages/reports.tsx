import * as React from "react"
import { Printer, FileText, AlertCircle, PackageOpen, Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useSettings } from "@/src/lib/SettingsContext"
import { fetchActivities, fetchBooks } from "@/src/lib/db"

export default function Reports() {
  const { settings } = useSettings();
  const [reportType, setReportType] = React.useState<'checkedout' | 'overdue' | 'inventory' | 'fines'>('checkedout');

  const [books, setBooks] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [booksData, activitiesData] = await Promise.all([
          fetchBooks(),
          fetchActivities()
        ]);
        setBooks(booksData);
        setActivities(activitiesData);
      } catch (err) {
        console.error("Failed to load report data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  
  const checkedOutBooksData = React.useMemo(() => {
    const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const bookStates = new Map<string, any>();
    
    sortedActivities.forEach(act => {
      const key = act.memberId + "::" + act.bookTitle;
      if (act.action === 'Check Out') {
        const coDate = new Date(act.date);
        const dDate = new Date(coDate);
        dDate.setDate(dDate.getDate() + (settings.loanPeriod || 14));
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
      let fine = 0;
      if (daysOverdue > (settings.gracePeriod || 0)) {
        fine = daysOverdue * settings.fineRate;
        if (fine > settings.maxFine) fine = settings.maxFine;
      }
      
      return {
        ...state,
        daysOverdue,
        fineAmount: fine
      };
    });
  }, [activities, settings.fineRate, settings.maxFine, settings.gracePeriod, settings.loanPeriod]);

  const getCheckedOutBooks = () => checkedOutBooksData;

  const overdueBooksData = React.useMemo(() => {
    return checkedOutBooksData.filter(item => item.daysOverdue > 0);
  }, [checkedOutBooksData]);

  const getOverdueBooks = () => overdueBooksData;

  const getInventoryStatus = () => {
    return books;
  };

  const getFinesReport = () => {
    // Generate fines based on overdue books
    return getOverdueBooks().filter(item => item.fineAmount > 0);
  };

  const handlePrintPdf = () => {
    const doc = new jsPDF();
    const safeCurrency = settings.currencySymbol === "₹" ? "Rs." : (settings.currencySymbol === "€" ? "EUR " : (settings.currencySymbol === "£" ? "GBP " : settings.currencySymbol));
    
    // Add title
    doc.setFontSize(20);
    doc.text(settings.libraryName || "Library Management System", 14, 22);
    
    // Add subtitle
    doc.setFontSize(14);
    let title = "";
    if (reportType === 'checkedout') title = "Checked Out Books Report";
    if (reportType === 'overdue') title = "Overdue Books Report";
    if (reportType === 'inventory') title = "Inventory Status Report";
    if (reportType === 'fines') title = "Fines Report";
    doc.text(title, 14, 32);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 40);

    let head: string[][] = [];
    let body: any[][] = [];

        if (reportType === 'checkedout') {
      head = [["SI No", "Student ID", "Name", "Book Name", "Checked Out From", "Days Overdue", `Fine (${safeCurrency})`]];
      body = getCheckedOutBooks().map((item, index) => [
        (index + 1).toString(),
        item.memberId || '',
        item.memberName || '',
        item.bookTitle || '',
        item.checkoutDate || '',
        item.daysOverdue > 0 ? `${item.daysOverdue} days` : '-',
        item.fineAmount > 0 ? `${safeCurrency}${item.fineAmount.toFixed(2)}` : '-'
      ]);
    } else if (reportType === 'overdue') {
      head = [["Member Name", "Book Title", "Due Date", "Days Overdue", `Fine Amount (${safeCurrency})`]];
      body = getOverdueBooks().map(item => [
        item.memberName,
        item.bookTitle,
        new Date(item.dueDate).toLocaleDateString(),
        `${item.daysOverdue} days`,
        `${safeCurrency}${item.fineAmount.toFixed(2)}`
      ]);
    } else if (reportType === 'inventory') {
      head = [["Book ID", "Title", "Author", "Category", "Available", "Total"]];
      body = getInventoryStatus().map(book => [
        book.id,
        book.title,
        book.author,
        book.category,
        book.copiesAvailable.toString(),
        book.copiesTotal.toString()
      ]);
    } else if (reportType === 'fines') {
      head = [["Member Name", "Book Title", "Due Date", `Fine Amount (${safeCurrency})`]];
      body = getFinesReport().map(item => [
        item.memberName,
        item.bookTitle,
        new Date(item.dueDate).toLocaleDateString(),
        `${safeCurrency}${item.fineAmount.toFixed(2)}`
      ]);
    }

    autoTable(doc, {
      startY: 45,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [244, 119, 45] }
    });

    doc.save(`library_report_${reportType}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Exports</h2>
          <p className="text-sm text-slate-500">Generate and print library reports.</p>
        </div>
        <Button onClick={handlePrintPdf} className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-teal-600 text-white">
          <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
        <Button 
          variant={reportType === 'checkedout' ? 'default' : 'outline'} 
          onClick={() => setReportType('checkedout')}
          className={reportType === 'checkedout' ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent' : ''}
        >
          <PackageOpen className="mr-2 h-4 w-4" /> Checked Out Books
        </Button>
        <Button 
          onClick={() => setReportType('overdue')}
          className={reportType === 'overdue' ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent' : ''}
        >
          <AlertCircle className="mr-2 h-4 w-4" /> Overdue Books
        </Button>
        <Button 
          variant={reportType === 'inventory' ? 'default' : 'outline'} 
          onClick={() => setReportType('inventory')}
          className={reportType === 'inventory' ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent' : ''}
        >
          <PackageOpen className="mr-2 h-4 w-4" /> Inventory Status
        </Button>
        <Button 
          variant={reportType === 'fines' ? 'default' : 'outline'} 
          onClick={() => setReportType('fines')}
          className={reportType === 'fines' ? 'bg-teal-600 hover:bg-teal-700 text-white border-transparent' : ''}
        >
          <FileText className="mr-2 h-4 w-4" /> Fines Report
        </Button>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-0">
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 uppercase">{settings.libraryName || "Library Management System"}</h1>
            <h2 className="text-xl font-semibold text-slate-700 mt-2">
              {reportType === 'checkedout' && 'Checked Out Books Report'}
              {reportType === 'overdue' && 'Overdue Books Report'}
              {reportType === 'inventory' && 'Inventory Status Report'}
              {reportType === 'fines' && 'Fines Report'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 print:bg-transparent print:border-b-2 print:border-slate-800 border-b border-slate-100">
                {reportType === 'checkedout' && (
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
                {reportType === 'overdue' && (
                  <tr>
                    <th className="px-6 py-4 font-bold">Member Name</th>
                    <th className="px-6 py-4 font-bold">Book Title</th>
                    <th className="px-6 py-4 font-bold">Due Date</th>
                    <th className="px-6 py-4 font-bold text-right">Days Overdue</th>
                    <th className="px-6 py-4 font-bold text-right">Fine Amount ({settings.currencySymbol})</th>
                  </tr>
                )}
                {reportType === 'inventory' && (
                  <tr>
                    <th className="px-6 py-4 font-bold">Book ID</th>
                    <th className="px-6 py-4 font-bold">Title & Author</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold text-right">Available / Total</th>
                  </tr>
                )}
                {reportType === 'fines' && (
                  <tr>
                    <th className="px-6 py-4 font-bold">Member Name</th>
                    <th className="px-6 py-4 font-bold">Book Title</th>
                    <th className="px-6 py-4 font-bold">Due Date</th>
                    <th className="px-6 py-4 font-bold text-right">Fine Amount ({settings.currencySymbol})</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {reportType === 'checkedout' && getCheckedOutBooks().map((item, i) => (
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
                {reportType === 'overdue' && getOverdueBooks().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4 text-red-600">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">{item.daysOverdue} days</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{settings.currencySymbol}{item.fineAmount.toFixed(2)}</td>
                  </tr>
                ))}
                
                {reportType === 'inventory' && getInventoryStatus().map((book, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium text-slate-500">{book.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{book.title}</p>
                      <p className="text-xs text-slate-500">{book.author}</p>
                    </td>
                    <td className="px-6 py-4">{book.category}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={book.copiesAvailable === 0 ? "text-red-500" : "text-green-600"}>
                        {book.copiesAvailable}
                      </span>
                      <span className="text-slate-400"> / {book.copiesTotal}</span>
                    </td>
                  </tr>
                ))}

                {reportType === 'fines' && getFinesReport().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{settings.currencySymbol}{item.fineAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
