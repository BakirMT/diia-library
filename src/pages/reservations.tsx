import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Avatar } from "@/src/components/ui/avatar"
import { 
  Bookmark, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertCircle, 
  BookOpen, 
  X,
  TrendingUp
} from "lucide-react"
import { 
  fetchReservations, 
  fetchMembers, 
  updateReservation, 
  updateBook, 
  addActivity, 
  addNotification,
  fetchActivities
} from "@/src/lib/db"
import { db } from "@/src/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useSettings } from "@/src/lib/SettingsContext"

export default function AdminReservations() {
  const { settings } = useSettings();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [cancellingReservation, setCancellingReservation] = React.useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allReservations, allMembers, allActivities] = await Promise.all([
        fetchReservations(),
        fetchMembers(),
        fetchActivities()
      ]);
      setReservations(allReservations);
      setMembers(allMembers);
      setActivities(allActivities);
    } catch (err) {
      console.error("Error loading admin reservations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const membersMap = React.useMemo(() => {
    const map = new Map<string, any>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  const activeCheckouts = React.useMemo(() => {
    const bookStates = new Map<string, string>();
    const sorted = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(act => {
      if (!act.memberId || !act.bookTitle) return;
      const key = `${act.memberId}::${act.bookTitle}`;
      if (act.action === 'Check Out') {
        bookStates.set(key, 'Active');
      } else if (act.action === 'Check In') {
        bookStates.set(key, 'Returned');
      }
    });

    const activeSet = new Set<string>();
    bookStates.forEach((status, key) => {
      if (status === 'Active') {
        activeSet.add(key);
      }
    });
    return activeSet;
  }, [activities]);

  const handleMarkReady = async (res: any) => {
    const key = `${res.memberId}::${res.title}`;
    if (activeCheckouts.has(key)) {
      alert("this is already checked out");
      return;
    }

    setProcessingId(res.id);
    try {
      // 1. Update reservation status to Fulfilled (acting as a direct checkout)
      await updateReservation(res.id, {
        status: 'Fulfilled'
      });

      const member = membersMap.get(res.memberId);

      // 2. Add 'Check Out' activity in the activity collection to link it as a dynamic loan
      await addActivity({
        id: `ACT-${Date.now()}`,
        memberId: res.memberId,
        memberName: member?.name || 'A Member',
        bookTitle: res.title,
        action: 'Check Out',
        date: new Date().toISOString(),
        status: 'Pending'
      });

      // 3. Notify member of checkout
      await addNotification({
        userId: res.memberId,
        title: 'Book Checked Out',
        message: `Your reserved book "${res.title}" has been checked out to you.`,
        type: 'checkout'
      });

      // Reload all data to refresh state
      await loadData();
    } catch (err) {
      console.error("Failed to convert reservation to checkout:", err);
      alert("Failed to update reservation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (res: any) => {
    const key = `${res.memberId}::${res.title}`;
    if (activeCheckouts.has(key)) {
      alert("this is already checked out");
      return;
    }

    setProcessingId(res.id);
    try {
      // 1. Update reservation status to Fulfilled
      await updateReservation(res.id, {
        status: 'Fulfilled'
      });

      const member = membersMap.get(res.memberId);

      // 2. Add 'Check Out' activity in the activity collection to link it as a dynamic loan
      await addActivity({
        id: `ACT-${Date.now()}`,
        memberId: res.memberId,
        memberName: member?.name || 'A Member',
        bookTitle: res.title,
        action: 'Check Out',
        date: new Date().toISOString(),
        status: 'Pending'
      });

      // 3. Notify member
      await addNotification({
        userId: res.memberId,
        title: 'Reservation Fulfilled',
        message: `Your reservation for "${res.title}" has been successfully completed.`,
        type: 'reservation'
      });

      // Reload all data to refresh state
      await loadData();
    } catch (err) {
      console.error("Failed to fulfill reservation:", err);
      alert("Failed to fulfill reservation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = (res: any) => {
    setCancellingReservation(res);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingReservation) return;
    const res = cancellingReservation;
    setProcessingId(res.id);
    setCancellingReservation(null);
    try {
      // 1. Mark reservation as Cancelled
      await updateReservation(res.id, {
        status: 'Cancelled'
      });

      // 2. Replenish book copies available
      if (res.bookId) {
        try {
          const bookDoc = await getDoc(doc(db, 'books', res.bookId));
          if (bookDoc.exists()) {
            const bookData = bookDoc.data();
            const newCopies = (bookData.copiesAvailable || 0) + 1;
            const updates: any = { copiesAvailable: newCopies };
            if (bookData.status === 'Reserved' || bookData.status === 'Checked Out') {
              updates.status = 'Available';
            }
            await updateBook(res.bookId, updates);
          }
        } catch (bookErr) {
          console.error("Error updating book copies during reservation cancel:", bookErr);
        }
      }

      // 3. Notify Member
      await addNotification({
        userId: res.memberId,
        title: 'Reservation Cancelled ❌',
        message: `Your reservation request for "${res.title}" has been cancelled.`,
        type: 'reservation'
      });

      // Update local state
      setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'Cancelled' } : r));
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      alert("Failed to cancel reservation.");
    } finally {
      setProcessingId(null);
    }
  };

  const stats = React.useMemo(() => {
    let active = 0;
    let ready = 0;
    let queue = 0;
    let fulfilled = 0;

    reservations.forEach(r => {
      if (r.status === 'In Queue') {
        queue++;
        active++;
      } else if (r.status === 'Ready for pickup') {
        ready++;
        active++;
      } else if (r.status === 'Fulfilled') {
        fulfilled++;
      }
    });

    return { active, ready, queue, fulfilled };
  }, [reservations]);

  const filteredReservations = React.useMemo(() => {
    return reservations.filter(res => {
      const member = membersMap.get(res.memberId);
      const memberName = member?.name || '';
      const matchesSearch = 
        String(res.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(res.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(memberName).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || res.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter, membersMap]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reservations</h2>
        <p className="text-sm text-slate-500">Manage book reservation requests and pickup statuses across all members.</p>
      </div>

      {/* Stats Widgets */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-[var(--color-primary)]">
                <Bookmark className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready for Pickup</p>
                <h3 className="mt-2 text-3xl font-bold text-emerald-600">{stats.ready}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Queue</p>
                <h3 className="mt-2 text-3xl font-bold text-amber-500">{stats.queue}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fulfilled</p>
                <h3 className="mt-2 text-3xl font-bold text-blue-600">{stats.fulfilled}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by book title, author, or member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Queue">In Queue (Pending)</option>
              <option value="Ready for pickup">Ready for Pickup</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grid List of Reservations */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="text-sm text-slate-500 mt-2">Loading reservations...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl border-slate-200">
            <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900">No reservations found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filteredReservations.map((res) => {
            const member = membersMap.get(res.memberId);
            return (
              <Card key={res.id} className="shadow-sm border-slate-100 hover:border-slate-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left section: Book and Member */}
                    <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)] shrink-0 mt-1">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="space-y-3 flex-1 min-w-0">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 truncate">{res.title}</h4>
                          <p className="text-sm text-slate-500">by {res.author}</p>
                        </div>

                        {/* Member Details */}
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                          <Avatar 
                            className="h-8 w-8 ring-2 ring-white"
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${member?.name || 'A'}&backgroundColor=F4772D`}
                            fallback={member?.fallback || 'M'}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{member?.name || 'Unknown Member'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{member?.email || 'No email'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle section: Dates and Status */}
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs md:text-sm text-slate-600 lg:justify-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="font-medium text-slate-500">Requested:</span>
                          <span className="ml-1 text-slate-900 font-semibold">{res.date}</span>
                        </div>
                      </div>

                      {res.status === 'Ready for pickup' && res.expires && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-500 animate-pulse" />
                          <div>
                            <span className="font-medium text-slate-500">Pickup by:</span>
                            <span className="ml-1 text-emerald-700 font-bold">{res.expires}</span>
                          </div>
                        </div>
                      )}

                      {res.status === 'In Queue' && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="font-medium text-slate-500">Queue Pos:</span>
                            <span className="ml-1 text-slate-900 font-semibold">#{res.position || 1}</span>
                          </div>
                        </div>
                      )}

                      <div className="shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                          res.status === 'Ready for pickup' 
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' 
                            : res.status === 'In Queue' 
                            ? 'bg-amber-50 text-amber-700 ring-amber-600/10'
                            : res.status === 'Fulfilled'
                            ? 'bg-blue-50 text-blue-700 ring-blue-600/10'
                            : 'bg-slate-50 text-slate-600 ring-slate-600/10'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                    </div>

                    {/* Right section: Action Buttons */}
                    <div className="flex sm:flex-row gap-2 shrink-0 justify-end lg:w-60">
                      {res.status === 'In Queue' && (
                        <>
                          {!activeCheckouts.has(`${res.memberId}::${res.title}`) ? (
                            <Button
                              size="sm"
                              disabled={processingId !== null}
                              onClick={() => handleMarkReady(res)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                            >
                              Ready for Pickup
                            </Button>
                          ) : (
                            <span className="text-xs text-red-500 font-semibold self-center mr-2 bg-red-50 px-2 py-1 rounded flex items-center gap-1 border border-red-100">
                              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              this is already checked out
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId !== null}
                            onClick={() => handleCancel(res)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {res.status === 'Ready for pickup' && (
                        <>
                          {!activeCheckouts.has(`${res.memberId}::${res.title}`) ? (
                            <Button
                              size="sm"
                              disabled={processingId !== null}
                              onClick={() => handleFulfill(res)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                            >
                              Fulfill (Check Out)
                            </Button>
                          ) : (
                            <span className="text-xs text-red-500 font-semibold self-center mr-2 bg-red-50 px-2 py-1 rounded flex items-center gap-1 border border-red-100">
                              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              this is already checked out
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId !== null}
                            onClick={() => handleCancel(res)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      {(res.status === 'Fulfilled' || res.status === 'Cancelled') && (
                        <span className="text-xs text-slate-400 italic">No actions available</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {cancellingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancellingReservation(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Cancellation</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to cancel the reservation for "{cancellingReservation.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCancellingReservation(null)}>
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleCancelConfirm}
              >
                Cancel Reservation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
