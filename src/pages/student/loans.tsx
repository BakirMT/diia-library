import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { BookOpen, CheckCircle, Clock, AlertCircle, CreditCard, RotateCw } from "lucide-react"
import { useAuth } from "@/src/lib/AuthContext"
import { useSettings } from "@/src/lib/SettingsContext"
import { db } from "@/src/lib/firebase"
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore"
import { Button } from "@/src/components/ui/button"
import { sendMessage } from "@/src/lib/db"

export default function StudentLoans() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = React.useState('checked-out');
  const [memberInfo, setMemberInfo] = React.useState<any>(null);
  
  const [checkedOut, setCheckedOut] = React.useState<any[]>([]);
  const [overdue, setOverdue] = React.useState<any[]>([]);
  const [checkedIn, setCheckedIn] = React.useState<any[]>([]);
  const [fines, setFines] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Get user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // 2. Find matching member
        const membersSnap = await getDocs(collection(db, 'members'));
        let matchedMember = null;

        const isEmailMatch = (email1: string, email2: string) => {
          if (!email1 || !email2) return false;
          const clean = (e: string) => e.toLowerCase().trim().replace('@gmai.com', '@gmail.com');
          return clean(email1) === clean(email2);
        };

        membersSnap.forEach(d => {
          const data = d.data();
          const safeId = d.id.replace(/[^a-zA-Z0-9]/g, '');
          const internalEmail = `${safeId}@v2.member.libsys.local`;
          if (
            (userData?.username && data.username?.toLowerCase() === userData.username.toLowerCase()) ||
            (userData?.email && isEmailMatch(data.email, userData.email)) ||
            (user.email && isEmailMatch(data.email, user.email)) ||
            user.email === internalEmail
          ) {
            matchedMember = { id: d.id, ...data };
          }
        });
        
        if (!matchedMember) {
           setIsLoading(false);
           return;
        }
        
        setMemberInfo(matchedMember);
        
        // 3. Get activities for this member
        const activitiesSnap = await getDocs(collection(db, 'activities'));
        const memberActivities = activitiesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(a => a.memberId === (matchedMember as any).id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
        // Reconstruct state
        // Group by book title (simplification since we don't store bookId in activity!)
        const bookStates = new Map<string, {
            title: string, 
            checkoutDate: string, 
            dueDate: string, 
            status: string,
            history: any[],
            renewCount?: number,
            hasPendingRequest?: boolean
         }>();
        
        memberActivities.forEach(act => {
           if (act.action === 'Check Out') {
               const coDate = new Date(act.date);
               const dDate = new Date(coDate);
               dDate.setDate(dDate.getDate() + (settings.loanPeriod || 14));
               
               if (bookStates.has(act.bookTitle)) {
                  const state = bookStates.get(act.bookTitle)!;
                  state.status = 'Active';
                  state.checkoutDate = coDate.toISOString().split('T')[0];
                  state.dueDate = dDate.toISOString().split('T')[0];
                  state.renewCount = 0;
                  state.hasPendingRequest = false;
                  state.history.push({
                     borrowed: coDate.toISOString().split('T')[0],
                     returned: null
                  });
               } else {
                  bookStates.set(act.bookTitle, {
                      title: act.bookTitle,
                      checkoutDate: coDate.toISOString().split('T')[0],
                      dueDate: dDate.toISOString().split('T')[0],
                      status: 'Active',
                      history: [{ borrowed: coDate.toISOString().split('T')[0], returned: null }],
                      renewCount: 0,
                       hasPendingRequest: false
                   });
               }
           } else if (act.action === 'Renew') {
               const state = bookStates.get(act.bookTitle);
               if (state && state.status === 'Active') {
                  const dDate = new Date(state.dueDate);
                  dDate.setDate(dDate.getDate() + 7); // extend 7 days
                  state.dueDate = dDate.toISOString().split('T')[0];
                  state.renewCount = (state.renewCount || 0) + 1;
                   state.hasPendingRequest = false;
               }
           } else if (act.action === 'Renew Request') {
                const state = bookStates.get(act.bookTitle);
                if (state && state.status === 'Active' && act.status === 'Pending') {
                   state.hasPendingRequest = true;
                }
            } else if (act.action === 'Check In') {
               const state = bookStates.get(act.bookTitle);
               if (state) {
                  state.status = 'Returned';
                   state.hasPendingRequest = false;
                  const lastH = state.history[state.history.length - 1];
                  if (lastH && !lastH.returned) {
                     lastH.returned = new Date(act.date).toISOString().split('T')[0];
                  }
               }
           }
        });
        
        // Fetch books to get cover images
        const booksSnap = await getDocs(collection(db, 'books'));
        const booksMap = new Map();
        booksSnap.forEach(b => {
           const data = b.data();
           booksMap.set(data.title, data);
        });
        
        const currentCheckouts: any[] = [];
        const overdueBooks: any[] = [];
        const returnedHistory: any[] = [];
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        bookStates.forEach((state, title) => {
           const bookInfo = booksMap.get(title) || { author: 'Unknown', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop' };
           
           if (state.status === 'Active') {
              const due = new Date(state.dueDate);
              if (due < today) {
                  const diffTime = Math.abs(today.getTime() - due.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  overdueBooks.push({
                      id: title,
                      title,
                      author: bookInfo.author,
                      dueDate: state.dueDate,
                      cover: bookInfo.cover || bookInfo.imageUrl || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=100&auto=format&fit=crop',
                      daysOverdue: diffDays,
                      fineEstimate: diffDays > (settings.gracePeriod || 0) ? Math.min(settings.maxFine || 20, diffDays * (settings.fineRate || 0.5)) : 0,
                       renewCount: state.renewCount || 0,
                        hasPendingRequest: state.hasPendingRequest || false
                   });
              } else {
                  currentCheckouts.push({
                      id: title,
                      title,
                      author: bookInfo.author,
                      dueDate: state.dueDate,
                      cover: bookInfo.cover || bookInfo.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop',
                       renewCount: state.renewCount || 0,
                        hasPendingRequest: state.hasPendingRequest || false
                   });
              }
           }
           
           state.history.forEach(h => {
               if (h.returned) {
                   returnedHistory.push({
                       id: `${title}-${h.borrowed}-${h.returned}-${Math.random().toString(36).substring(2, 9)}`,
                       title,
                       author: bookInfo.author,
                       borrowed: h.borrowed,
                       returned: h.returned
                   });
               }
           });
        });
        
        // Fines logic (mock or derived from overdue)
        const currentFines = overdueBooks.map((ob, idx) => ({
            id: `fine-${idx}`,
            reason: `Overdue: ${ob.title}`,
            amount: ob.fineEstimate,
            date: new Date().toISOString().split('T')[0],
            status: 'Unpaid'
        }));
        
        setCheckedOut(currentCheckouts);
        setOverdue(overdueBooks);
        setCheckedIn(returnedHistory.sort((a,b) => new Date(b.returned).getTime() - new Date(a.returned).getTime()));
        setFines(currentFines);
        
      } catch(err) {
         console.error("Failed to load member loans", err);
      } finally {
         setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleRenew = async (loan: any) => {
    if (!memberInfo) return;

    if (loan.renewCount && loan.renewCount >= 1) {
      alert("This book has already been renewed. Renewal is allowed only once.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      alert("This book is overdue and cannot be renewed. Please check it in first.");
      return;
    }

    const newDueDate = new Date(dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);

    try {
      // Add Activity
      await addDoc(collection(db, "activities"), {
        id: `ACT-${Date.now()}`,
        memberId: memberInfo.id,
        memberName: memberInfo.name || 'Unknown',
        bookTitle: loan.title,
        action: 'Renew Request',
        date: new Date().toISOString(),
        status: 'Pending'
      });

      // Add Notification for Member
      await addDoc(collection(db, "notifications"), {
        userId: memberInfo.id,
        title: 'Renew Requested',
        message: `You have requested to renew "${loan.title}". This is pending librarian approval.`,
        type: 'renew',
        timestamp: Date.now(),
        unread: true
      });

      // Add Notification for Admin
      await addDoc(collection(db, "notifications"), {
        userId: 'admin',
        title: 'Renew Request',
        message: `${memberInfo.name} has requested to renew "${loan.title}".`,
        type: 'renew',
        timestamp: Date.now(),
        unread: true
      });

      const renewMessage = `I would like to renew the book "${loan.title}".`;
      const metadata = { type: 'renew', bookTitle: loan.title, memberId: memberInfo.id };
      
      await sendMessage(memberInfo.id, renewMessage, false, 'Admin', metadata);
      await sendMessage(memberInfo.id, renewMessage, false, 'Librarian', metadata);

      alert(`Successfully requested renewal! Please wait for admin approval.`);
      
      // Update local state
      setCheckedOut(prev => prev.map(l => 
        l.id === loan.id ? { ...l, hasPendingRequest: true } : l
      ));

    } catch (err) {
      console.error("Failed to request renewal", err);
      alert("Failed to request renewal. Please try again.");
    }
  };

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Loans & Fines</h2>
          <p className="text-sm text-slate-500">Manage your checked out books, returns, and library fines.</p>
        </div>
      </div>

      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('checked-out')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'checked-out' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Checked Out ({checkedOut.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'overdue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="h-4 w-4" /> Overdue Books ({overdue.length})
        </button>
        <button
          onClick={() => setActiveTab('checked-in')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'checked-in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle className="h-4 w-4" /> Checked In
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'fines' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Fines ({fines.length})
        </button>
      </div>

      {activeTab === 'checked-out' && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            {checkedOut.length === 0 ? (
              <p className="text-slate-500 text-sm">You have no books checked out right now.</p>
            ) : (
              <div className="space-y-4">
                {checkedOut.map(loan => (
                  <div key={loan.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-14 bg-slate-200 rounded-md shrink-0 overflow-hidden shadow-sm">
                        <img src={loan.cover} className="h-full w-full object-cover" alt="Book cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{loan.title}</h4>
                        <p className="text-xs text-slate-500 mb-2">{loan.author}</p>
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">Due {loan.dueDate}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(loan.renewCount || 0) >= 1 || loan.hasPendingRequest}
                        onClick={() => handleRenew(loan)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                      >
                        <RotateCw className="h-3 w-3 mr-1.5" />
                        {(loan.renewCount || 0) >= 1 
                          ? 'Renewed' 
                          : loan.hasPendingRequest 
                            ? 'Requested' 
                            : 'Request Renew'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'overdue' && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Books</CardTitle>
          </CardHeader>
          <CardContent>
             {overdue.length === 0 ? (
              <p className="text-slate-500 text-sm">You have no overdue books. Great job!</p>
            ) : (
              <div className="space-y-4">
                {overdue.map(loan => (
                  <div key={loan.id} className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/50">
                    <div className="h-20 w-14 bg-slate-200 rounded-md shrink-0 overflow-hidden shadow-sm">
                      <img src={loan.cover} className="h-full w-full object-cover" alt="Book cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{loan.title}</h4>
                      <p className="text-xs text-slate-500 mb-2">{loan.author}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="destructive" className="text-[10px]">Overdue by {loan.daysOverdue} days</Badge>
                        <span className="text-xs font-semibold text-red-600">Est. Fine: {settings.currencySymbol}{loan.fineEstimate.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'checked-in' && (
        <Card>
          <CardHeader>
            <CardTitle>Checked In History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {checkedIn.length === 0 ? (
               <div className="p-6"><p className="text-slate-500 text-sm">No reading history found.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Book</th>
                      <th className="px-6 py-4 font-medium">Checked Out</th>
                      <th className="px-6 py-4 font-medium">Checked In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checkedIn.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.author}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.borrowed}</td>
                        <td className="px-6 py-4 text-slate-600">{item.returned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'fines' && (
        <Card>
          <CardHeader>
            <CardTitle>Library Fines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {fines.length === 0 ? (
               <div className="p-6"><p className="text-slate-500 text-sm">You have no fines.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Reason</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Amount</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fines.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{item.reason}</td>
                        <td className="px-6 py-4 text-slate-600">{item.date}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{settings.currencySymbol}{item.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={item.status === 'Unpaid' ? 'destructive' : 'outline'} className={item.status === 'Unpaid' ? '' : 'bg-green-50 text-green-700 border-green-200'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
