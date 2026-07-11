import * as React from "react"
import { Search, BookUp, BookDown, CheckCircle2, User, Library, Clock, RotateCw, X, Trash2 } from "lucide-react"
import { fetchMembers, fetchBooks, addActivity, fetchActivities, fetchReservations, updateBook, addNotification, updateMember, updateActivity } from "@/src/lib/db"
import { useSettings } from "@/src/lib/SettingsContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Avatar } from "@/src/components/ui/avatar"

type CheckoutRecord = {
  id: string;
  book: any;
  checkoutDate: string;
  dueDate: string;
  renewCount?: number;
  hasPendingRequest?: boolean;
}

export default function Circulation() {
  const clean = (s: string) => String(s || '').trim().toLowerCase();
  const { settings } = useSettings();
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [books, setBooks] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchMembers().then(setMembers);
    fetchBooks().then(setBooks);
    fetchReservations().then(setReservations);
  }, []);
  const [activeTab, setActiveTab] = React.useState<'checkout' | 'checkin' | 'reservations'>('checkout');
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [bookSearch, setBookSearch] = React.useState('');
  const [memberSearchTerm, setMemberSearchTerm] = React.useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = React.useState(false);
  const memberSearchRef = React.useRef<HTMLDivElement>(null);
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberSearchRef.current && !memberSearchRef.current.contains(event.target)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = React.useMemo(() => {
    if (!memberSearchTerm.trim()) return members.slice(0, 50); // limit to 50
    return members.filter(m => 
      String(m.name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
      String(m.id || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
    ).slice(0, 50);
  }, [members, memberSearchTerm]);

  
  const [activeCheckouts, setActiveCheckouts] = React.useState<Record<string, CheckoutRecord[]>>({});
  
  React.useEffect(() => {
    fetchActivities().then(allActivities => {
      const bookStates = new Map<string, any>();
      // sort by date ascending
      const sorted = [...allActivities].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sorted.forEach(act => {
        if (!act.memberId || !act.bookTitle) return;
        
        const key = act.memberId + "::" + act.bookTitle;
        if (act.action === 'Check Out') {
           const coDate = new Date(act.date);
           const dDate = new Date(coDate);
           dDate.setDate(dDate.getDate() + 14);
           bookStates.set(key, {
              id: act.id,
              memberId: act.memberId,
              bookTitle: act.bookTitle,
              checkoutDate: coDate.toISOString().split('T')[0],
              dueDate: dDate.toISOString().split('T')[0],
              status: 'Active',
              renewCount: 0,
              hasPendingRequest: false
           });
        } else if (act.action === 'Renew') {
           const state = bookStates.get(key);
           if (state && state.status === 'Active') {
              const dDate = new Date(state.dueDate);
              dDate.setDate(dDate.getDate() + 7);
              state.dueDate = dDate.toISOString().split('T')[0];
              state.renewCount = (state.renewCount || 0) + 1;
              state.hasPendingRequest = false;
           }
        } else if (act.action === 'Renew Request') {
           const state = bookStates.get(key);
           if (state && state.status === 'Active' && act.status === 'Pending') {
              state.hasPendingRequest = true;
           }
        } else if (act.action === 'Check In') {
           const state = bookStates.get(key);
           if (state) {
              state.status = 'Returned';
              state.hasPendingRequest = false;
           }
        }
      });
      
      const pReqs = sorted.filter(act => act.action === 'Renew Request' && act.status === 'Pending');
      setPendingRequests(pReqs);
      
      const checkoutsByMember: Record<string, CheckoutRecord[]> = {};
      bookStates.forEach(state => {
         if (state.status === 'Active') {
            if (!checkoutsByMember[state.memberId]) checkoutsByMember[state.memberId] = [];
            checkoutsByMember[state.memberId].push({
               id: state.id,
               book: { title: state.bookTitle, author: 'Unknown', cover: '' },
               checkoutDate: state.checkoutDate,
               dueDate: state.dueDate,
               renewCount: state.renewCount || 0,
               hasPendingRequest: state.hasPendingRequest || false
            });
         }
      });
      
      // Let's attach actual book data
      fetchBooks().then(allBooks => {
         const booksMap = new Map();
         allBooks.forEach(b => booksMap.set(b.title, b));
         
         const checkedOutTitles = new Set<string>();
         
         Object.values(checkoutsByMember).forEach(records => {
            records.forEach(r => {
               checkedOutTitles.add(r.book.title);
               const b = booksMap.get(r.book.title);
               if (b) r.book = b;
            });
         });

         // Auto-fix stale books based on actual checkout counts
         const checkoutCounts = new Map();
         Object.values(checkoutsByMember).forEach(records => {
             records.forEach(r => {
                 checkoutCounts.set(r.book.title, (checkoutCounts.get(r.book.title) || 0) + 1);
             });
         });

         allBooks.forEach(b => {
             const checkedOut = checkoutCounts.get(b.title) || 0;
             const total = b.copiesTotal || 1;
             const available = Math.max(0, total - checkedOut);
             const computedStatus = available === 0 ? 'Checked Out' : 'Available';
             
             if (b.copiesAvailable !== available || b.status !== computedStatus) {
                 console.log('Auto-fixing stale book state:', b.title);
                 updateBook(b.id, { copiesAvailable: available, status: computedStatus }).catch(console.error);
             }
         });

         setActiveCheckouts(checkoutsByMember);
      });
    });
  }, []);

  const selectedMember = React.useMemo(() => 
    members.find(m => m.id === selectedMemberId),
  [selectedMemberId]);

  const memberRecords = selectedMemberId ? (activeCheckouts[selectedMemberId] || []) : [];

  const handleCheckOut = async (book: any) => {
    if (!selectedMemberId) return;
    
    // Check if they already have it
    const alreadyHas = memberRecords.find(r => r.book.id === book.id);
    if (alreadyHas) {
      alert("Member already has this book checked out.");
      return;
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const newRecord: CheckoutRecord = {
      id: `CO-${Date.now()}`,
      book,
      checkoutDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0]
    };

    setActiveCheckouts(prev => ({
      ...prev,
      [selectedMemberId]: [...(prev[selectedMemberId] || []), newRecord]
    }));
    
    // Update book in DB
    try {
      const newCopiesAvailable = Math.max(0, (book.copiesAvailable || 1) - 1);
      const newStatus = newCopiesAvailable === 0 ? 'Checked Out' : book.status;
      await updateBook(book.id, {
        copiesAvailable: newCopiesAvailable,
        status: newStatus
      });
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, copiesAvailable: newCopiesAvailable, status: newStatus } : b));
    } catch (err) {
      console.error("Failed to update book", err);
    }
    
    setBookSearch('');

    await addActivity({
      id: `ACT-${Date.now()}`,
      memberId: selectedMemberId,
      memberName: selectedMember?.name || 'Unknown',
      bookTitle: book.title,
      action: 'Check Out',
      date: today.toISOString(),
      status: 'Pending'
    });

    await addNotification({
      userId: selectedMemberId,
      title: 'Book Checked Out',
      message: `You have checked out "${book.title}". Due date is ${dueDate.toISOString().split('T')[0]}.`,
      type: 'checkout'
    });
  };

  const handleRenew = async (recordId: string) => {
    if (!selectedMemberId) return;
    const recordToRenew = memberRecords.find(r => r.id === recordId);
    if (!recordToRenew) return;

    if (recordToRenew.renewCount && recordToRenew.renewCount >= 1) {
      alert("This book has already been renewed. Renewal is allowed only once.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(recordToRenew.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      alert("This book is overdue and cannot be renewed. Please check it in first.");
      return;
    }

    const newDueDate = new Date(dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);

    setActiveCheckouts(prev => ({
      ...prev,
      [selectedMemberId]: prev[selectedMemberId].map(r => 
        r.id === recordId ? { ...r, dueDate: newDueDate.toISOString().split('T')[0], renewCount: (r.renewCount || 0) + 1, hasPendingRequest: false } : r
      )
    }));

    // Find and update the pending renew request in Firestore to 'Completed'
    const cleanTitleRenew = clean(recordToRenew.book.title);
    try {
      const allActs = await fetchActivities();
      const pendingReq = allActs.find(act => 
        (clean(act.memberId) === clean(selectedMemberId) || 
         (selectedMember?.name && clean(act.memberName) === clean(selectedMember.name))) &&
        clean(act.bookTitle) === cleanTitleRenew &&
        act.action === 'Renew Request' &&
        act.status === 'Pending'
      );
      if (pendingReq) {
        await updateActivity(pendingReq.id, { status: 'Completed' });
      }
    } catch (err) {
      console.error("Failed to update pending renew request", err);
    }

    // Update local pending requests state
    setPendingRequests(prev => prev.filter(req => {
      const isMemberMatch = clean(req.memberId) === clean(selectedMemberId) || 
                            (selectedMember?.name && clean(req.memberName) === clean(selectedMember.name));
      const isBookMatch = clean(req.bookTitle) === cleanTitleRenew;
      return !(isMemberMatch && isBookMatch);
    }));

    await addActivity({
      id: `ACT-${Date.now()}`,
      memberId: selectedMemberId,
      memberName: selectedMember?.name || 'Unknown',
      bookTitle: recordToRenew.book.title,
      action: 'Renew',
      date: new Date().toISOString(),
      status: 'Completed'
    });

    await addNotification({
      userId: selectedMemberId,
      title: 'Book Renewed',
      message: `You have renewed "${recordToRenew.book.title}". New due date is ${newDueDate.toISOString().split('T')[0]}.`,
      type: 'renew'
    });
  };

  const handleCheckIn = async (recordId: string) => {
    if (!selectedMemberId) return;
    const recordToReturn = memberRecords.find(r => r.id === recordId);
    if (!recordToReturn) return;

    // Auto-cancel any pending renew request for this book/member
    const cleanTitleReturn = clean(recordToReturn.book.title);
    try {
      const allActs = await fetchActivities();
      const pendingReq = allActs.find(act => 
        (clean(act.memberId) === clean(selectedMemberId) || 
         (selectedMember?.name && clean(act.memberName) === clean(selectedMember.name))) &&
        clean(act.bookTitle) === cleanTitleReturn &&
        act.action === 'Renew Request' &&
        act.status === 'Pending'
      );
      if (pendingReq) {
        await updateActivity(pendingReq.id, { status: 'Completed' });
      }
    } catch (err) {
      console.error("Failed to update pending renew request on check in", err);
    }

    // Update local pending requests state
    setPendingRequests(prev => prev.filter(req => {
      const isMemberMatch = clean(req.memberId) === clean(selectedMemberId) || 
                            (selectedMember?.name && clean(req.memberName) === clean(selectedMember.name));
      const isBookMatch = clean(req.bookTitle) === cleanTitleReturn;
      return !(isMemberMatch && isBookMatch);
    }));

    // Check if overdue and calculate fine
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(recordToReturn.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let fineCharged = 0;
    if (dueDate < today) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineCharged = Math.min(settings.maxFine, diffDays * settings.fineRate);
    }

    if (fineCharged > 0) {
      try {
        const currentFines = Number(selectedMember?.finesDue || 0);
        const updatedFines = currentFines + fineCharged;
        await updateMember(selectedMemberId, { finesDue: updatedFines });
        setMembers(prev => prev.map(m => m.id === selectedMemberId ? { ...m, finesDue: updatedFines } : m));
      } catch (err) {
        console.error("Failed to update member fines on check in", err);
      }
    }

    setActiveCheckouts(prev => ({
      ...prev,
      [selectedMemberId]: prev[selectedMemberId].filter(r => r.id !== recordId)
    }));

    if (recordToReturn) {
      try {
        const book = recordToReturn.book;
        if (book && book.id) {
          const newCopiesAvailable = Math.min(book.copiesTotal || 1, (book.copiesAvailable || 0) + 1);
          await updateBook(book.id, {
            copiesAvailable: newCopiesAvailable,
            status: 'Available'
          });
          setBooks(prev => prev.map(b => b.id === book.id ? { ...b, copiesAvailable: newCopiesAvailable, status: 'Available' } : b));
        }
      } catch (err) {
        console.error("Failed to update book on checkin", err);
      }

      await addActivity({
        id: `ACT-${Date.now()}`,
        memberId: selectedMemberId,
        memberName: selectedMember?.name || 'Unknown',
        bookTitle: recordToReturn.book.title,
        action: 'Check In',
        date: new Date().toISOString(),
        status: 'Completed'
      });

      await addNotification({
        userId: selectedMemberId,
        title: 'Book Checked In',
        message: `You have successfully checked in "${recordToReturn.book.title}".${fineCharged > 0 ? ` A fine of $${fineCharged.toFixed(2)} was added to your account.` : ''}`,
        type: 'checkin'
      });
    }
  };

  const handleDeleteRenewRequest = async (reqId: string, bookTitle: string, memberId: string, memberName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to reject the renew request for "${bookTitle}"?`)) return;

    try {
      await updateActivity(reqId, { status: 'Rejected' });
      
      await addNotification({
        userId: memberId,
        title: 'Renew Request Rejected',
        message: `Your request to renew "${bookTitle}" has been rejected. Please return the book.`,
        type: 'renew'
      });

      setPendingRequests(prev => prev.filter(r => r.id !== reqId));

      setActiveCheckouts(prev => {
        const memberCheckouts = prev[memberId];
        if (!memberCheckouts) return prev;
        return {
          ...prev,
          [memberId]: memberCheckouts.map(r => 
            clean(r.book.title) === clean(bookTitle) ? { ...r, hasPendingRequest: false } : r
          )
        };
      });

      alert("Renew request rejected successfully.");
    } catch (err) {
      console.error("Failed to reject renew request:", err);
      alert("Failed to reject renew request.");
    }
  };

  const filteredBooks = React.useMemo(() => {
    if (!bookSearch.trim()) return [];
    return books.filter(b => 
      String(b.title || '').toLowerCase().includes(String(bookSearch || '').toLowerCase()) || 
      String(b.author || '').toLowerCase().includes(String(bookSearch || '').toLowerCase()) ||
      String(b.isbn || '').includes(bookSearch)
    );
  }, [bookSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Circulation</h2>
          <p className="text-sm text-slate-500">Check in and check out books for members.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Member Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Member</CardTitle>
              <CardDescription>Choose a member to manage their circulation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative" ref={memberSearchRef}>
                  <div 
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white cursor-text focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2"
                    onClick={() => setIsMemberDropdownOpen(true)}
                  >
                    <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                    <input 
                      type="text" 
                      className="w-full bg-transparent outline-none placeholder:text-slate-500"
                      placeholder="Search member by name or ID..."
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        setIsMemberDropdownOpen(true);
                        if (selectedMemberId) {
                          setSelectedMemberId(null);
                        }
                      }}
                      onFocus={() => setIsMemberDropdownOpen(true)}
                    />
                  </div>
                  {isMemberDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {filteredMembers.length > 0 ? (
                        <ul className="py-1">
                          {filteredMembers.map(member => (
                            <li 
                              key={member.id}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                              onClick={() => {
                                setSelectedMemberId(member.id);
                                setMemberSearchTerm(member.name);
                                setIsMemberDropdownOpen(false);
                              }}
                            >
                              <span className="font-medium text-slate-900">{member.name}</span>
                              <span className="text-slate-500 text-xs">{member.id}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-500 text-center">No members found</div>
                      )}
                    </div>
                  )}
                </div>

                {selectedMember && (
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                    <Avatar 
                      className="h-12 w-12 border-2 border-white shadow-sm"
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedMember.name}&backgroundColor=F4772D`}
                      fallback={selectedMember.fallback}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{selectedMember.name}</p>
                      <p className="text-xs text-slate-500">{selectedMember.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedMember.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {selectedMember.status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {memberRecords.length} items out
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {pendingRequests.length > 0 && (
            <Card className="border-amber-100 bg-amber-50/20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                  Pending Renew Requests
                </CardTitle>
                <CardDescription className="text-xs">
                  Members requesting a book renewal.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => {
                        setSelectedMemberId(req.memberId);
                        const m = members.find(mem => mem.id === req.memberId);
                        if (m) setMemberSearchTerm(m.name);
                        setActiveTab('checkin');
                      }}
                      className="p-3 bg-white border border-slate-100 hover:border-amber-200 hover:shadow-sm rounded-xl cursor-pointer transition-all text-xs space-y-1 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {req.memberName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(req.date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => handleDeleteRenewRequest(req.id, req.bookTitle, req.memberId, req.memberName, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Reject request"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 font-medium line-clamp-1">
                        {req.bookTitle}
                      </p>
                      <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        <span>Click to review and approve</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Circulation Actions */}
        <div className="lg:col-span-2">
          {!selectedMember ? (
            <Card className="h-full flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 border-dashed">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No Member Selected</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Select a member from the dropdown to check out new books or check in their returned items.
              </p>
            </Card>
          ) : (
            <Card className="h-full shadow-sm border-slate-200">
              <div className="flex border-b border-slate-100">
                <button
                  className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex justify-center items-center gap-2 ${
                    activeTab === 'checkout'
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('checkout')}
                >
                  <BookUp className="h-4 w-4" /> Check Out
                </button>
                <button
                  className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex justify-center items-center gap-2 ${
                    activeTab === 'checkin'
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('checkin')}
                >
                  <BookDown className="h-4 w-4" /> Check In
                  {memberRecords.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-xs">
                      {memberRecords.length}
                    </span>
                  )}
                </button>
              </div>

              <CardContent className="p-6">
                {activeTab === 'checkout' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="Search for books by title, author, or ISBN..." 
                        className="pl-10 rounded-xl bg-slate-50 border-slate-200 h-12"
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                      />
                    </div>

                    {bookSearch.trim() && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-900">Search Results</h4>
                        {filteredBooks.length > 0 ? (
                          <div className="grid gap-4">
                            {filteredBooks.map(book => (
                              <div key={book.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-100 hover:bg-orange-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-10 bg-slate-100 rounded overflow-hidden shrink-0">
                                    {book.cover ? (
                                      <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <Library className="h-4 w-4 text-slate-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 text-sm">{book.title}</p>
                                    <p className="text-xs text-slate-500">{book.author}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-mono text-slate-400">{book.isbn}</span>
                                      <span className="text-xs text-slate-300">•</span>
                                      <span className={`text-xs font-medium ${book.copiesAvailable > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {book.copiesAvailable} available
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCheckOut(book)}
                                  disabled={book.copiesAvailable === 0}
                                  className="rounded-full shrink-0"
                                >
                                  Check Out
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-slate-500">No books found matching your search.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!bookSearch.trim() && (
                      <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-xl">
                        <BookUp className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 font-medium">Search for a book above to check it out to {selectedMember.name.split(' ')[0]}.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'checkin' && (
                  <div className="space-y-4">
                    {memberRecords.length > 0 ? (
                      <div className="grid gap-4">
                        {memberRecords.map(record => {
                          const isOverdue = new Date(record.dueDate) < new Date();
                          return (
                            <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white gap-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-10 bg-slate-100 rounded overflow-hidden shrink-0">
                                  {record.book.cover ? (
                                    <img src={record.book.cover} alt={record.book.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Library className="h-4 w-4 text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">{record.book.title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1">{record.book.author}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <Clock className="h-3 w-3" />
                                      <span>Out: {record.checkoutDate}</span>
                                    </div>
                                    <span className="text-slate-300">•</span>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                      <span className={isOverdue ? 'bg-red-100 px-1.5 py-0.5 rounded text-red-700' : ''}>
                                        Due: {record.dueDate}
                                      </span>
                                    </div>
                                    {record.hasPendingRequest && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse uppercase tracking-wider">
                                          Renew Requested
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                {!isOverdue && (
                                  <Button 
                                    variant={record.hasPendingRequest ? "default" : "outline"} 
                                    size="sm" 
                                    disabled={(record.renewCount || 0) >= 1}
                                    onClick={() => handleRenew(record.id)}
                                    className={`shrink-0 flex-1 sm:flex-none disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 ${
                                      record.hasPendingRequest 
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm shadow-amber-100 font-semibold' 
                                        : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                                    }`}
                                  >
                                    <RotateCw className="h-4 w-4 mr-2" />
                                    {record.hasPendingRequest 
                                      ? 'Approve Renew' 
                                      : (record.renewCount || 0) >= 1 ? 'Renewed' : 'Renew'}
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleCheckIn(record.id)}
                                  className="shrink-0 flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Check In
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-xl">
                        <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-900 mb-1">{selectedMember.name} is all caught up!</p>
                        <p className="text-xs text-slate-500">There are no books currently checked out to this member.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
