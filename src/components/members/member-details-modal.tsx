import * as React from "react";
import { X, BookOpen, Clock, AlertTriangle, CreditCard, Mail, Phone, MapPin, Calendar, Edit2, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Avatar } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { fetchActivities, fetchFines } from "@/src/lib/db";
import { useSettings } from "@/src/lib/SettingsContext";
import { useAuth } from "@/src/lib/AuthContext";

interface MemberDetailsModalProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

type TabType = 'info' | 'all-checkouts' | 'to-check-in' | 'overdue' | 'fines';

export function MemberDetailsModal({ member, isOpen, onClose, onEdit }: MemberDetailsModalProps) {
  const { settings } = useSettings();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = React.useState<TabType>('info');
  
  const [stats, setStats] = React.useState({
    activeCheckouts: 0,
    overdueBooks: 0,
    totalFines: 0,
    toCheckIn: 0
  });
  const [lists, setLists] = React.useState({
    allCheckouts: [] as any[],
    toCheckIn: [] as any[],
    overdue: [] as any[],
    fines: [] as any[]
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isOpen || !member) return;
    
    let isMounted = true;
    setLoading(true);
    setActiveTab('info');

    Promise.all([fetchActivities(), fetchFines()]).then(([activities, fines]) => {
      if (!isMounted) return;
      
      const memberActivities = activities.filter(a => a.memberId === member.id);
      const allCheckouts = memberActivities.filter(a => a.action === 'Check Out');
      
      const bookStates = new Map();
      const sorted = [...memberActivities].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sorted.forEach(act => {
        if (!act.bookTitle) return;
        if (act.action === 'Check Out') {
           const coDate = new Date(act.date);
           const dDate = new Date(coDate);
           dDate.setDate(dDate.getDate() + (settings.loanPeriod || 14));
           bookStates.set(act.bookTitle, { dueDate: dDate, status: 'Active', checkoutDate: coDate });
        } else if (act.action === 'Renew') {
           const state = bookStates.get(act.bookTitle);
           if (state && state.status === 'Active') {
              const dDate = new Date(state.dueDate);
              dDate.setDate(dDate.getDate() + 7);
              state.dueDate = dDate;
           }
        } else if (act.action === 'Check In') {
           bookStates.set(act.bookTitle, { status: 'Returned' });
        }
      });

      const activeList: any[] = [];
      const overdueList: any[] = [];
      const today = new Date();
      today.setHours(0,0,0,0);

      Array.from(bookStates.entries()).forEach(([title, state]) => {
        if (state.status === 'Active') {
          const item = { bookTitle: title, dueDate: state.dueDate, checkoutDate: state.checkoutDate };
          activeList.push(item);
          if (state.dueDate < today) overdueList.push(item);
        }
      });

      const memberFines = fines.filter(f => f.memberId === member.id);
      const totalFinesDue = memberFines.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);

      setStats({
        activeCheckouts: allCheckouts.length, // Total ever checked out
        toCheckIn: activeList.length,
        overdueBooks: overdueList.length,
        totalFines: totalFinesDue
      });
      
      setLists({
        allCheckouts: allCheckouts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        toCheckIn: activeList.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        overdue: overdueList.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        fines: memberFines.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      });
      
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [isOpen, member, settings.loanPeriod]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <Avatar src={member.photoURL || undefined} fallback={member.fallback} className="h-12 w-12" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
              <div className="text-sm text-slate-500">ID: {member.id} &bull; {member.membershipType}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'Admin' && (
              <Button variant="outline" size="sm" onClick={onEdit} className="h-8">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div 
                  className={`rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 ${activeTab === 'all-checkouts' ? 'bg-blue-100 border-blue-300' : 'bg-blue-50 border-transparent hover:bg-blue-100/50'}`}
                  onClick={() => setActiveTab('all-checkouts')}
                >
                  <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{stats.activeCheckouts}</div>
                  <div className="text-xs font-medium text-blue-700">Checked Out (All)</div>
                </div>
                
                <div 
                  className={`rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 ${activeTab === 'to-check-in' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-transparent hover:bg-amber-100/50'}`}
                  onClick={() => setActiveTab('to-check-in')}
                >
                  <Clock className="w-6 h-6 text-amber-600 mb-2" />
                  <div className="text-2xl font-bold text-amber-900">{stats.toCheckIn}</div>
                  <div className="text-xs font-medium text-amber-700">To Check In</div>
                </div>

                <div 
                  className={`rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 ${activeTab === 'overdue' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-transparent hover:bg-red-100/50'}`}
                  onClick={() => setActiveTab('overdue')}
                >
                  <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-900">{stats.overdueBooks}</div>
                  <div className="text-xs font-medium text-red-700">Overdue</div>
                </div>

                <div 
                  className={`rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 ${activeTab === 'fines' ? 'bg-emerald-100 border-emerald-300' : 'bg-emerald-50 border-transparent hover:bg-emerald-100/50'}`}
                  onClick={() => setActiveTab('fines')}
                >
                  <CreditCard className="w-6 h-6 text-emerald-600 mb-2" />
                  <div className="text-2xl font-bold text-emerald-900">{settings.currencySymbol}{stats.totalFines.toFixed(2)}</div>
                  <div className="text-xs font-medium text-emerald-700">Fines History</div>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === 'info' && 'Member Information'}
                    {activeTab === 'all-checkouts' && 'All Time Checkouts'}
                    {activeTab === 'to-check-in' && 'Currently Checked Out (To Check In)'}
                    {activeTab === 'overdue' && 'Overdue Books'}
                    {activeTab === 'fines' && 'Fine History'}
                  </h3>
                  {activeTab !== 'info' && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('info')} className="h-7 text-xs text-slate-500">
                      <ArrowLeft className="w-3 h-3 mr-1" /> Back to Info
                    </Button>
                  )}
                </div>
                
                <div className="p-4">
                  {activeTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">
                          <Mail className="w-3.5 h-3.5" /> Email Address
                        </div>
                        <div className="text-slate-900 font-medium">{member.email || 'Not provided'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">
                          <Phone className="w-3.5 h-3.5" /> Phone Number
                        </div>
                        <div className="text-slate-900 font-medium">{member.phone || 'Not provided'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">
                          <MapPin className="w-3.5 h-3.5" /> Address
                        </div>
                        <div className="text-slate-900 font-medium">{member.address || 'Not provided'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">
                          <Calendar className="w-3.5 h-3.5" /> Registration Date
                        </div>
                        <div className="text-slate-900 font-medium">{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Unknown'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Username</div>
                        <div className="text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit font-medium">{member.username || '-'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Class / Grade</div>
                        <div className="text-slate-900 font-medium">{member.studentClass || 'N/A'}</div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Status</div>
                        <div>
                          <Badge variant="secondary" className={member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {member.status || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'all-checkouts' && (
                    <div className="overflow-x-auto">
                      {lists.allCheckouts.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-4 text-center">No checkout history found.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="pb-2 font-medium">Book Title</th>
                              <th className="pb-2 font-medium">Date Checked Out</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lists.allCheckouts.map((a, i) => (
                              <tr key={i}>
                                <td className="py-2 text-slate-900 font-medium">{a.bookTitle}</td>
                                <td className="py-2 text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'to-check-in' && (
                    <div className="overflow-x-auto">
                      {lists.toCheckIn.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-4 text-center">No books currently checked out.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="pb-2 font-medium">Book Title</th>
                              <th className="pb-2 font-medium">Checked Out</th>
                              <th className="pb-2 font-medium">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lists.toCheckIn.map((a, i) => (
                              <tr key={i}>
                                <td className="py-2 text-slate-900 font-medium">{a.bookTitle}</td>
                                <td className="py-2 text-slate-600">{new Date(a.checkoutDate).toLocaleDateString()}</td>
                                <td className="py-2 text-slate-600">{new Date(a.dueDate).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'overdue' && (
                    <div className="overflow-x-auto">
                      {lists.overdue.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-4 text-center">No overdue books.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="pb-2 font-medium">Book Title</th>
                              <th className="pb-2 font-medium">Due Date</th>
                              <th className="pb-2 font-medium">Days Overdue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lists.overdue.map((a, i) => {
                              const today = new Date();
                              today.setHours(0,0,0,0);
                              const diffTime = Math.abs(today.getTime() - a.dueDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return (
                                <tr key={i}>
                                  <td className="py-2 text-slate-900 font-medium">{a.bookTitle}</td>
                                  <td className="py-2 text-red-600 font-medium">{new Date(a.dueDate).toLocaleDateString()}</td>
                                  <td className="py-2 text-red-600">{diffDays} days</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'fines' && (
                    <div className="overflow-x-auto">
                      {lists.fines.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-4 text-center">No fine history found.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="pb-2 font-medium">Reason</th>
                              <th className="pb-2 font-medium">Date</th>
                              <th className="pb-2 font-medium text-right">Amount</th>
                              <th className="pb-2 font-medium text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lists.fines.map((f, i) => (
                              <tr key={i}>
                                <td className="py-2 text-slate-900 font-medium">{f.reason || 'Fine'}</td>
                                <td className="py-2 text-slate-600">{new Date(f.date).toLocaleDateString()}</td>
                                <td className="py-2 text-slate-900 font-bold text-right">{settings.currencySymbol}{f.amount.toFixed(2)}</td>
                                <td className="py-2 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${f.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {f.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

