import * as React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Users, UserPlus, DollarSign, BookOpen, Clock, UsersRound, BookCopy, ArrowRight } from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts"

import { fetchBooks, fetchMembers, fetchActivities } from "@/src/lib/db"

const COLORS = ['#F4772D', '#1E293B', '#64748B', '#CBD5E1'];

export default function Dashboard() {
  const [notified, setNotified] = React.useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [activeUsers, setActiveUsers] = React.useState(42);
  const [overdueAlerts, setOverdueAlerts] = React.useState<any[]>([]);
  const [topBooks, setTopBooks] = React.useState<any[]>([]);
  const [growthData, setGrowthData] = React.useState<any[]>([]);
  const [circulationData, setCirculationData] = React.useState<any[]>([]);
  const [categoryData, setCategoryData] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    activeMembers: 0,
    checkedOutBooks: 0,
    totalBooks: 0,
    overdueCheckIns: 0,
    categoriesCount: 0
  });

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const usersTimer = setInterval(() => {
      setActiveUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    
    // Fetch real data
    Promise.all([fetchBooks(), fetchMembers(), fetchActivities()]).then(([books, members, activities]) => {
      const activeMembers = members.filter((m: any) => m?.status === 'Active').length;
        
        let totalBooks = 0;
        let checkedOutBooks = 0;
        const categories = new Set();
        const catCounts: Record<string, number> = {};
        
        const booksWithCheckoutCount = books.map((b: any) => {
          if (!b) return { checkedOutCount: 0 };
          const t = b.copiesTotal || 0;
          const a = b.copiesAvailable ?? t;
          totalBooks += t;
          checkedOutBooks += (t - a);
          if (b.category) { categories.add(b.category); catCounts[b.category] = (catCounts[b.category] || 0) + t; }
          
          return {
            ...b,
            checkedOutCount: (t - a)
          };
        });
        
        // Sort by checked out count descending
        const sortedBooks = [...booksWithCheckoutCount].sort((a, b) => b.checkedOutCount - a.checkedOutCount);
        setTopBooks(sortedBooks.slice(0, 4));
        
        // dynamically compute overdue
        const bookStates = new Map<string, any>();
        const sortedActivities = [...activities].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sortedActivities.forEach(act => {
           if (!act.memberId || !act.bookTitle) return;
           const key = act.memberId + "::" + act.bookTitle;
           if (act.action === 'Check Out') {
              const coDate = new Date(act.date);
              const dDate = new Date(coDate);
              dDate.setDate(dDate.getDate() + 14);
              bookStates.set(key, { ...act, dueDate: dDate.toISOString().split('T')[0], status: 'Active' });
           } else if (act.action === 'Renew') {
              const state = bookStates.get(key);
              if (state && state.status === 'Active') {
                 const dDate = new Date(state.dueDate);
                 dDate.setDate(dDate.getDate() + 7);
                 state.dueDate = dDate.toISOString().split('T')[0];
              }
           } else if (act.action === 'Check In') {
              const state = bookStates.get(key);
              if (state) state.status = 'Returned';
           }
        });
        
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);
        
        const overdue: any[] = [];
        bookStates.forEach(state => {
           if (state.status === 'Active') {
              const due = new Date(state.dueDate);
              if (due < todayDate) {
                 overdue.push(state);
              }
           }
        });
        
        setOverdueAlerts(overdue.slice(0, 5));
        
        // Also update checkedOutBooks from dynamic calculation instead of static inventory difference
        let dynamicCheckedOut = 0;
        bookStates.forEach(state => {
           if (state.status === 'Active') dynamicCheckedOut++;
        });
        checkedOutBooks = dynamicCheckedOut;
        

        const today = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            members: 0
          });
        }

        members.forEach((m: any) => {
          let joinDate = m.joinDate ? new Date(m.joinDate) : new Date(today.getFullYear(), today.getMonth() - 6, 1);
          for (let i = 0; i < months.length; i++) {
            const monthEnd = new Date(months[i].year, months[i].month + 1, 0);
            if (joinDate <= monthEnd) {
              months[i].members++;
            }
          }
        });
        setGrowthData(months);

        // Category Data
        const newCatData = Object.keys(catCounts).map(k => ({ name: k, value: catCounts[k] }));
        setCategoryData(newCatData.sort((a, b) => b.value - a.value));

        // Circulation Data
        const circMonths = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          circMonths.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            borrowed: 0,
            returned: 0
          });
        }

        activities.forEach((a: any) => {
          if (a.date) {
            const actDate = new Date(a.date);
            for (let i = 0; i < circMonths.length; i++) {
              if (actDate.getFullYear() === circMonths[i].year && actDate.getMonth() === circMonths[i].month) {
                if (a.action === 'Check Out') circMonths[i].borrowed++;
                else if (a.action === 'Check In') circMonths[i].returned++;
              }
            }
          }
        });
        setCirculationData(circMonths);

        setStats({
          activeMembers,
          checkedOutBooks,
          totalBooks,
          overdueCheckIns: overdue.length,
          categoriesCount: categories.size
        });
      });

    return () => {
      clearInterval(timer);
      clearInterval(usersTimer);
    };
  }, []);

  const handleNotify = (name: string) => {
    setNotified(prev => new Set(prev).add(name));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Monitoring library vitals and activities.</p>
        </div>
        
        {/* Real-time pinned status */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 sm:gap-4 bg-white border border-slate-200 shadow-sm rounded-lg px-3 sm:px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-3 sm:pr-4 shrink-0">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-sm font-medium text-slate-700">Live</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">Active Visitors</span>
            <span className="text-sm font-bold text-slate-900">{activeUsers}</span>
          </div>
          <div className="flex flex-col pl-3 sm:pl-4 border-l border-slate-100 shrink-0">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">Local Time</span>
            <span className="text-sm font-bold text-slate-900 font-mono whitespace-nowrap">
              {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Members</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.activeMembers.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-green-600 font-medium">
                +4.5% from last month
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checked Out Books</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.checkedOutBooks.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Out of {stats.totalBooks.toLocaleString()} total copies
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Check Ins</p>
              <h3 className="mt-1 text-2xl font-bold text-red-600">{stats.overdueCheckIns.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-red-400 font-medium">
                Requires notification
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Books</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.totalBooks.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Across {stats.categoriesCount} categories
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <BookCopy className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900">Membership Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="members" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Book Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Monthly Book Circulation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={circulationData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dx={-10} />
                  <Tooltip cursor={{ fill: 'var(--color-border)', opacity: 0.4 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
                  <Bar dataKey="borrowed" name="Checked Out" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" name="Checked In" fill="var(--color-navy-light)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">Overdue Books Alert</CardTitle>
            <Link to="/activity">
              <Button variant="ghost" size="sm" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-y border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Book</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {overdueAlerts.length > 0 ? overdueAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-[var(--color-text-main)]">{alert.memberName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{alert.bookTitle}</td>
                      <td className="px-4 py-3 text-red-500">
                        {Math.floor((new Date().getTime() - new Date(alert.date).getTime()) / (1000 * 3600 * 24))} Days Ago
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          variant={notified.has(alert.memberName) ? "secondary" : "outline"}
                          className="h-8 text-xs" 
                          onClick={() => handleNotify(alert.memberName)}
                          disabled={notified.has(alert.memberName)}
                        >
                          {notified.has(alert.memberName) ? 'Notified' : 'Notify'}
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No overdue books!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Top Checked Out Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBooks.length > 0 ? topBooks.map(book => (
                <div key={book.id} className="flex items-center gap-4">
                  <div className="h-12 w-8 bg-slate-200 rounded shrink-0 overflow-hidden">
                    <img 
                      src={book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop"} 
                      className="h-full w-full object-cover" 
                      alt={book.title} 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-[var(--color-text-muted)]">{book.author}</p>
                  </div>
                  <div className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded">
                    {book.checkedOutCount} out
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-slate-500">
                  No books have been checked out yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
