import * as React from "react"
import { Printer, FileText, AlertCircle, PackageOpen } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { MOCK_BOOKS, MOCK_MEMBERS, MOCK_ACTIVITIES } from "@/src/lib/mock-data"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useSettings } from "@/src/lib/SettingsContext"

export default function Reports() {
  const { settings } = useSettings();
  const [reportType, setReportType] = React.useState<'overdue' | 'inventory' | 'fines'>('overdue');

  const overdueBooksData = React.useMemo(() => {
    return MOCK_ACTIVITIES.filter(a => a.status === 'Overdue').map((item, index) => {
      // Use index to generate deterministic mock data rather than Math.random()
      const daysOverdue = (index % 10) + 1;
      let fine = daysOverdue * settings.fineRate;
      if (fine > settings.maxFine) fine = settings.maxFine;
      
      return {
        ...item,
        daysOverdue,
        fineAmount: fine
      };
    });
  }, [settings.fineRate, settings.maxFine]);

  const getOverdueBooks = () => overdueBooksData;

  const getInventoryStatus = () => {
    return MOCK_BOOKS;
  };

  const getFinesReport = () => {
    // Generate mock fines based on overdue books
    return getOverdueBooks();
  };

  const handlePrintPdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Libra Management System", 14, 22);
    
    // Add subtitle
    doc.setFontSize(14);
    let title = "";
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

    if (reportType === 'overdue') {
      head = [["Member Name", "Book Title", "Due Date", "Days Overdue", `Fine Amount (${settings.currencySymbol})`]];
      body = getOverdueBooks().map(item => [
        item.memberName,
        item.bookTitle,
        new Date(new Date(item.date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        `${item.daysOverdue} days`,
        `${settings.currencySymbol}${item.fineAmount.toFixed(2)}`
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
      head = [["Member Name", "Book Title", "Due Date", `Fine Amount (${settings.currencySymbol})`]];
      body = getFinesReport().map(item => [
        item.memberName,
        item.bookTitle,
        new Date(new Date(item.date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        `${settings.currencySymbol}${item.fineAmount.toFixed(2)}`
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
        <Button onClick={handlePrintPdf} className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-orange-600 text-white">
          <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
        <Button 
          variant={reportType === 'overdue' ? 'default' : 'outline'} 
          onClick={() => setReportType('overdue')}
          className={reportType === 'overdue' ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent' : ''}
        >
          <AlertCircle className="mr-2 h-4 w-4" /> Overdue Books
        </Button>
        <Button 
          variant={reportType === 'inventory' ? 'default' : 'outline'} 
          onClick={() => setReportType('inventory')}
          className={reportType === 'inventory' ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent' : ''}
        >
          <PackageOpen className="mr-2 h-4 w-4" /> Inventory Status
        </Button>
        <Button 
          variant={reportType === 'fines' ? 'default' : 'outline'} 
          onClick={() => setReportType('fines')}
          className={reportType === 'fines' ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent' : ''}
        >
          <FileText className="mr-2 h-4 w-4" /> Fines Report
        </Button>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-0">
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 uppercase">Libra Management System</h1>
            <h2 className="text-xl font-semibold text-slate-700 mt-2">
              {reportType === 'overdue' && 'Overdue Books Report'}
              {reportType === 'inventory' && 'Inventory Status Report'}
              {reportType === 'fines' && 'Fines Report'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 print:bg-transparent print:border-b-2 print:border-slate-800 border-b border-slate-100">
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
                {reportType === 'overdue' && getOverdueBooks().map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="px-6 py-4 font-medium">{item.memberName}</td>
                    <td className="px-6 py-4">{item.bookTitle}</td>
                    <td className="px-6 py-4 text-red-600">{new Date(new Date(item.date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
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
                    <td className="px-6 py-4">{new Date(new Date(item.date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
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
