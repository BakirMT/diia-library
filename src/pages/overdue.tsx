import * as React from "react"
import { AlertCircle, Search, Mail, ArrowRight, Library, BookOpen, Edit2, Trash2, X } from "lucide-react"
import { fetchActivities, fetchMembers, fetchBooks, updateActivity, deleteActivity, addNotification, sendMessage } from "@/src/lib/db"
import { useSettings } from "@/src/lib/SettingsContext"
import { useAuth } from "@/src/lib/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Avatar } from "@/src/components/ui/avatar"
import { Link } from "react-router-dom"

export default function Overdue() {
  const { settings } = useSettings();
  const { role } = useAuth();
  const [activities, setActivities] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])
  const [books, setBooks] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [notifiedRows, setNotifiedRows] = React.useState<Set<string>>(new Set())
  const [editingActivity, setEditingActivity] = React.useState<any | null>(null)
  const [editStatus, setEditStatus] = React.useState("")
  const [deletingActivity, setDeletingActivity] = React.useState<any | null>(null)

  React.useEffect(() => {
    fetchActivities().then(setActivities)
    fetchMembers().then(setMembers)
    fetchBooks().then(setBooks)
  }, [])

  const overdueActivities = React.useMemo(() => {
    // 1. Map all activities to active states
    const bookStates = new Map<string, any>();
    const sorted = [...activities].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(act => {
      if (!act.memberId || !act.bookTitle) return;
      const key = act.memberId + "::" + act.bookTitle;
      
      if (act.action === 'Check Out') {
         const coDate = new Date(act.date);
         const dDate = new Date(coDate);
         dDate.setDate(dDate.getDate() + (settings.loanPeriod || 14));
         bookStates.set(key, {
            id: act.id,
            memberId: act.memberId,
            memberName: act.memberName,
            bookTitle: act.bookTitle,
            checkoutDate: coDate.toISOString().split('T')[0],
            dueDate: dDate.toISOString().split('T')[0],
            status: 'Active',
            originalActivity: act
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
         if (state) state.status = 'Returned';
      }
    });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const overdue: any[] = [];
    bookStates.forEach(state => {
       if (state.status === 'Active') {
          const due = new Date(state.dueDate);
          if (due < today) {
             const member = members.find(m => m.id === state.memberId);
             const book = books.find(b => b.title === state.bookTitle);
             const diffTime = Math.abs(today.getTime() - due.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             
             let fineEstimate = 0;
             if (diffDays > (settings.gracePeriod || 0)) {
               fineEstimate = Math.min(settings.maxFine || 20, diffDays * (settings.fineRate || 0.5));
             }
             
             overdue.push({
                ...state.originalActivity,
                id: state.id,
                memberId: state.memberId,
                memberName: member?.name || state.memberName,
                memberEmail: member?.email,
                memberPhone: member?.phone,
                bookTitle: state.bookTitle,
                dueDate: state.dueDate,
                daysOverdue: diffDays,
                fineEstimate: fineEstimate,
                status: 'Overdue'
             });
          }
       }
    });
    
    return overdue;
  }, [activities, members, books, settings])

  const filteredOverdue = React.useMemo(() => {
    if (!searchTerm.trim()) return overdueActivities
    return overdueActivities.filter(a => 
      (a.memberName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.bookTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.memberId || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [overdueActivities, searchTerm])

  const handleNotify = async (id: string) => {
    const activity = overdueActivities.find(a => a.id === id);
    if (!activity) return;
    try {
      const msg = `Your copy of "${activity.bookTitle}" was due on ${new Date(activity.dueDate).toLocaleDateString()}. It is ${activity.daysOverdue} days overdue. Est. fine: ${settings.currencySymbol}${activity.fineEstimate.toFixed(2)}.`;
      await addNotification({
        userId: activity.memberId,
        title: 'Overdue Book Notice',
        message: msg,
        type: 'overdue'
      });
      await sendMessage(activity.memberId, msg, true, role as 'Admin' | 'Librarian');
      setNotifiedRows(prev => new Set(prev).add(id));
    } catch (err) {
      console.error("Failed to send overdue notification:", err);
    }
  }

  const handleNotifyAll = async () => {
    const newSet = new Set(notifiedRows);
    for (const a of filteredOverdue) {
      if (!notifiedRows.has(a.id)) {
        try {
          const msg = `Your copy of "${a.bookTitle}" was due on ${new Date(a.dueDate).toLocaleDateString()}. It is ${a.daysOverdue} days overdue. Est. fine: ${settings.currencySymbol}${a.fineEstimate.toFixed(2)}.`;
          await addNotification({
            userId: a.memberId,
            title: 'Overdue Book Notice',
            message: msg,
            type: 'overdue'
          });
          await sendMessage(a.memberId, msg, true, role as 'Admin' | 'Librarian');
          newSet.add(a.id);
        } catch (err) {
          console.error("Failed to notify overdue for activity:", a.id, err);
        }
      }
    }
    setNotifiedRows(newSet);
  }

  const handleDelete = async () => {
    if (deletingActivity) {
      await deleteActivity(deletingActivity.id)
      setActivities(prev => prev.filter(a => a.id !== deletingActivity.id))
      setDeletingActivity(null)
    }
  }

  const handleOpenEdit = (activity: any) => {
    setEditingActivity(activity)
    setEditStatus(activity.status)
  }

  const handleSaveEdit = async () => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, { status: editStatus })
      setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, status: editStatus } : a))
      setEditingActivity(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Overdue Books</h2>
          <p className="text-sm text-slate-500">Manage and alert members with overdue books.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleNotifyAll}
            disabled={filteredOverdue.length === 0 || filteredOverdue.every(a => notifiedRows.has(a.id))}
          >
            <AlertCircle className="mr-2 h-4 w-4" /> 
            {filteredOverdue.length > 0 && filteredOverdue.every(a => notifiedRows.has(a.id)) 
              ? 'All Notified' 
              : 'Notify All'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-1 bg-red-50/50 border-red-100">
          <div className="p-5 flex items-start gap-4">
            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Total Overdue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-red-950">{overdueActivities.length}</h3>
                <span className="text-xs font-medium text-red-700">books</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by member or book..." 
              className="pl-9 bg-slate-50 border-transparent focus:bg-white focus:border-slate-300"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Book Details</th>
                <th className="px-6 py-4 font-medium">Overdue Info</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOverdue.length > 0 ? (
                filteredOverdue.map((activity) => {
                  const member = members.find(m => m.id === activity.memberId) || { email: '', name: activity.memberName }
                  return (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={member?.photoURL} fallback={member?.name || 'M'} className="h-10 w-10 border bg-white" />
                          <div>
                            <p className="font-semibold text-slate-900">{activity.memberName}</p>
                            <p className="text-xs text-slate-500">{member.email || activity.memberId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-8 bg-slate-100 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 max-w-[200px] truncate" title={activity.bookTitle}>
                              {activity.bookTitle}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-red-100 text-red-700">
                              Overdue
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-red-600">
                          {activity.daysOverdue} days overdue
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Due: {new Date(activity.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          Est. Fine: {settings.currencySymbol}{ (activity.fineEstimate || 0).toFixed(2) }
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleOpenEdit(activity)}
                          title="Edit Status"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeletingActivity(activity)}
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={notifiedRows.has(activity.id) ? "secondary" : "outline"} 
                          size="sm" 
                          className={notifiedRows.has(activity.id) ? "text-emerald-700 bg-emerald-50 border-transparent" : "text-slate-700"}
                          onClick={() => handleNotify(activity.id)}
                          disabled={notifiedRows.has(activity.id)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {notifiedRows.has(activity.id) ? 'Sent' : 'Notify'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No overdue books found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Activity Status</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingActivity(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
                <select 
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Changing status from "Overdue" will remove this record from the overdue list.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingActivity(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    
      {deletingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Confirm Deletion</h3>
              <Button variant="ghost" size="icon" onClick={() => setDeletingActivity(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this overdue record? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingActivity(null)}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

