import * as React from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Mail, Trash2, RotateCw } from "lucide-react"
import { fetchActivities, deleteActivity } from "@/src/lib/db"
import { exportToCSV } from "@/src/lib/export"

export default function Activity() {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchActivities().then(setActivities);
  }, []);
  const [filterType, setFilterType] = React.useState('All');
  const [notifiedGlobal, setNotifiedGlobal] = React.useState(false);
  const [notifiedRows, setNotifiedRows] = React.useState<Set<string>>(new Set());
  
  const handleDeleteActivity = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await deleteActivity(id);
        setActivities(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error("Failed to delete activity:", err);
      }
    }
  };

  
  const stats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkedOut = 0;
    let checkedIn = 0;
    let overdue = 0;

    activities.forEach(a => {
      const activityDate = new Date(a.date);
      const isToday = activityDate >= today;
      
      if (a.action === 'Check Out') {
        checkedOut++;
      } else if (a.action === 'Check In') {
        checkedIn++;
      }
      if (a.status === 'Overdue') {
        overdue++;
      }
    });

    return { checkedOut, checkedIn, overdue };
  }, [activities]);

  const filteredActivities = React.useMemo(() => {
    const filtered = activities.filter(activity => {
      const matchesSearch = 
        String(activity.memberName || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) ||
        String(activity.bookTitle || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) ||
        String(activity.id || '').toLowerCase().includes(String(searchTerm || '').toLowerCase());
        
      const matchesFilter = filterType === 'All' || activity.action === filterType;
      
      return matchesSearch && matchesFilter;
    });
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, filterType]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case 'Overdue': return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      case 'Pending': return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Check Out': return <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><ArrowUpRight className="h-4 w-4" /></div>;
      case 'Check In': return <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><ArrowDownRight className="h-4 w-4" /></div>;
      case 'Renew': return <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><RotateCw className="h-4 w-4" /></div>;
      default: return <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Clock className="h-4 w-4" /></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Library Activity</h2>
          <p className="text-sm text-slate-500">Monitor check-ins and check-outs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={notifiedGlobal ? "secondary" : "default"} 
            className={notifiedGlobal ? "" : "bg-red-600 hover:bg-red-700 text-white border-transparent"}
            disabled={notifiedGlobal}
            onClick={() => {
              const overdueActivities = activities.filter(a => a.status === 'Overdue');
              if (overdueActivities.length > 0) {
                setNotifiedGlobal(true);
              }
            }}
          >
            <AlertCircle className="mr-2 h-4 w-4" /> {notifiedGlobal ? 'Alerts Sent' : 'Send Overdue Alerts'}
          </Button>
          <Button variant="outline" className="text-slate-600 border-slate-200" onClick={() => exportToCSV(filteredActivities, "library-activity")}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Books Checked Out</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900">{stats.checkedOut}</h3>
                <span className="text-xs font-medium text-slate-500">total</span>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Books Checked In</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900">{stats.checkedIn}</h3>
                <span className="text-xs font-medium text-slate-500">total</span>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Newly Overdue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900">{stats.overdue}</h3>
                <span className="text-xs font-medium text-slate-500">total</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by member or book title..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Check Out', 'Check In'].map((type) => (
            <Button 
              key={type}
              variant={filterType === type ? "default" : "outline"}
              className={`rounded-full shrink-0 ${filterType !== type && "text-slate-600 border-slate-200"}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Book Details</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getActionIcon(activity.action)}
                        <div>
                          <p className="font-semibold text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{activity.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{activity.memberName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{activity.memberId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 max-w-[250px] truncate" title={activity.bookTitle}>
                        {activity.bookTitle}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(activity.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activity.status === 'Overdue' && (
                        <Button 
                          variant={notifiedRows.has(activity.id) ? "secondary" : "ghost"} 
                          size="sm" 
                          className={notifiedRows.has(activity.id) ? "" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                          disabled={notifiedRows.has(activity.id) || notifiedGlobal}
                          onClick={() => setNotifiedRows(prev => new Set(prev).add(activity.id))}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {notifiedRows.has(activity.id) || notifiedGlobal ? 'Alert Sent' : 'Send Alert'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No activity found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
