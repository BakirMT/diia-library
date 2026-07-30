import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { BookOpen, Clock, CalendarDays, Search, ArrowRight, Bookmark, CreditCard } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { useAuth } from "@/src/lib/AuthContext"
import { db } from "@/src/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { Link } from "react-router-dom"
import { useSettings } from "@/src/lib/SettingsContext"


export default function StudentDashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [checkedOut, setCheckedOut] = React.useState<any[]>([]);
  const [overdue, setOverdue] = React.useState<any[]>([]);
  const [fines, setFines] = React.useState<any[]>([]);
  const [memberInfo, setMemberInfo] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
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
        
        if (!matchedMember) { setIsLoading(false); return; }
        setMemberInfo(matchedMember);
        
        const activitiesSnap = await getDocs(collection(db, 'activities'));
        const memberActivities = activitiesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(a => a.memberId === (matchedMember as any).id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
        const bookStates = new Map<string, any>();
        memberActivities.forEach(act => {
           if (act.action === 'Check Out') {
               const coDate = new Date(act.date);
               const dDate = new Date(coDate);
               dDate.setDate(dDate.getDate() + (settings.loanPeriod || 14));
               bookStates.set(act.bookTitle, {
                  title: act.bookTitle,
                  dueDate: dDate.toISOString().split('T')[0],
                  status: 'Active',
               });
           } else if (act.action === 'Renew') {
               const state = bookStates.get(act.bookTitle);
               if (state && state.status === 'Active') {
                  const dDate = new Date(state.dueDate);
                  dDate.setDate(dDate.getDate() + 7);
                  state.dueDate = dDate.toISOString().split('T')[0];
               }
           } else if (act.action === 'Check In') {
               const state = bookStates.get(act.bookTitle);
               if (state) state.status = 'Returned';
           }
        });
        
        const booksSnap = await getDocs(collection(db, 'books'));
        const booksMap = new Map();
        booksSnap.forEach(b => booksMap.set(b.data().title, b.data()));
        
        const currentCheckouts: any[] = [];
        const overdueBooks: any[] = [];
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        bookStates.forEach((state, title) => {
           const bookInfo = booksMap.get(title) || { author: 'Unknown', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop' };
           if (state.status === 'Active') {
              const due = new Date(state.dueDate);
              if (due < today) {
                  const diffTime = Math.abs(today.getTime() - due.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let fineEstimate = 0;
                  if (diffDays > (settings.gracePeriod || 0)) {
                     fineEstimate = Math.min(settings.maxFine || 20, diffDays * (settings.fineRate || 0.5));
                  }
                  
                  overdueBooks.push({
                      id: title, title, author: bookInfo.author, dueDate: state.dueDate,
                      cover: bookInfo.cover || bookInfo.imageUrl || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=100&auto=format&fit=crop',
                      daysOverdue: diffDays, fineEstimate: fineEstimate
                  });
              } else {
                  currentCheckouts.push({
                      id: title, title, author: bookInfo.author, dueDate: state.dueDate,
                      cover: bookInfo.cover || bookInfo.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop',
                  });
              }
           }
        });
        
        const currentFines = overdueBooks.map((ob, idx) => ({
            id: `fine-${idx}`, reason: `Overdue: ${ob.title}`, amount: ob.fineEstimate,
            date: new Date().toISOString().split('T')[0], status: 'Unpaid'
        }));
        
        setCheckedOut(currentCheckouts);
        setOverdue(overdueBooks);
        
        // Include manually added fines from member info if they have a flat fine
        if (matchedMember.finesDue > 0) {
           const manualFinesAmt = matchedMember.finesDue - currentFines.reduce((sum, f) => sum + f.amount, 0);
           if (manualFinesAmt > 0) {
               currentFines.push({
                  id: 'manual-fine', reason: 'Account Balance', amount: manualFinesAmt,
                  date: new Date().toISOString().split('T')[0], status: 'Unpaid'
               });
           }
        }
        setFines(currentFines);
        
      } catch(err) {
         console.error(err);
      } finally {
         setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const totalFinesAmt = fines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Library</h2>
          <p className="text-sm text-slate-500">Welcome back, Student. Here is your reading overview.</p>
        </div>
        <div className="flex items-center gap-2 max-w-sm w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search catalog..." className="pl-9 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checked Out Books</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? '-' : (checkedOut.length + overdue.length)}</h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Books</p>
              <h3 className="mt-1 text-2xl font-bold text-red-600">{isLoading ? '-' : overdue.length}</h3>
            </div>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fines</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{isLoading ? '-' : `${settings.currencySymbol}${totalFinesAmt.toFixed(2)}`}</h3>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">Current Loans</CardTitle>
            <Link to="/student/loans">
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)] hover:text-teal-600">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...overdue, ...checkedOut].slice(0, 4).map(loan => (
                <div key={loan.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                  <div className="h-20 w-14 bg-slate-200 rounded-md shrink-0 overflow-hidden shadow-sm">
                    <img src={loan.cover} className="h-full w-full object-cover" alt="Book cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{loan.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{loan.author}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={loan.daysOverdue ? 'destructive' : 'secondary'} className="text-[10px]">
                        {loan.daysOverdue ? `Overdue by ${loan.daysOverdue} days` : 'Due ' + loan.dueDate}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {[...overdue, ...checkedOut].length === 0 && !isLoading && (
                 <p className="text-sm text-slate-500">You have no active loans.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">Fines Overview</CardTitle>
            <Link to="/student/loans">
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)] hover:text-teal-600">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fines.slice(0, 4).map(fine => (
                <div key={fine.id} className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-red-100 p-2 text-red-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{fine.reason}</h4>
                      <p className="text-xs text-slate-500">{fine.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-red-600">{settings.currencySymbol}{fine.amount.toFixed(2)}</p>
                     <p className="text-[10px] text-red-500 font-semibold">{fine.status}</p>
                  </div>
                </div>
              ))}
              {fines.length === 0 && !isLoading && (
                 <p className="text-sm text-slate-500">You have no outstanding fines.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
