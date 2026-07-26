import * as React from "react"
import { useAuth } from "@/src/lib/AuthContext"
import { Search, Bell, Menu, BookOpen, X, User, Activity, LogOut, ChevronDown } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Avatar } from "@/src/components/ui/avatar"
import { useNavigate, Link } from "react-router-dom"
import { db } from "@/src/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { fetchBooks, fetchMembers } from "@/src/lib/db"

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, role, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  const [allBooks, setAllBooks] = React.useState<any[]>([]);
  const [allMembers, setAllMembers] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchBooks().then(setAllBooks);
    fetchMembers().then(setAllMembers);
  }, []);

  const filteredBooks = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = String(searchQuery || '').toLowerCase();
    return allBooks.filter(book => 
      String(book.title || '').toLowerCase().includes(q) || 
      String(book.author || '').toLowerCase().includes(q) ||
      String(book.isbn || '').includes(q)
    ).slice(0, 3);
  }, [searchQuery, allBooks]);

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = String(searchQuery || '').toLowerCase();
    return allMembers.filter(member => 
      String(member.name || '').toLowerCase().includes(q) || 
      String(member.email || '').toLowerCase().includes(q) ||
      String(member.id || '').toLowerCase().includes(q)
    ).slice(0, 3);
  }, [searchQuery, allMembers]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [memberId, setMemberId] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Resolve memberId/admin ID
  React.useEffect(() => {
    const resolveUser = async () => {
      if (!user) return;
      if (role !== 'Member') {
        setMemberId(role?.toLowerCase() || 'admin');
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const username = userSnap.data().username;
          if (username) {
            const membersRef = collection(db, 'members');
            const q = query(membersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              setMemberId(querySnapshot.docs[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Error resolving member ID for notifications", err);
      }
    };
    resolveUser();
  }, [user, role]);

  // Real-time listener for notifications
  React.useEffect(() => {
    if (!memberId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', memberId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id });
      });
      // Sort by timestamp descending
      list.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(list);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return () => unsubscribe();
  }, [memberId]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.unread);
      if (unreadNotifications.length === 0) return;
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { unread: false });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const handleMarkOneRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { unread: false });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6 relative z-30 print:hidden">
      <div className="flex items-center gap-4 w-full max-w-md" ref={searchRef}>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:flex w-full items-center relative">
          <Input 
            type="text" 
            placeholder="Search books, members, transactions..." 
            icon={<Search className="h-4 w-4" />}
            className="bg-slate-50 border-transparent focus-visible:bg-white"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showResults && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100 overflow-hidden z-50 py-2">
              {filteredBooks.length === 0 && filteredMembers.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {filteredBooks.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Books</div>
                      {filteredBooks.map(book => (
                        <Link 
                          key={book.id} 
                          to="/books" 
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="h-8 w-6 bg-slate-200 rounded shrink-0 flex items-center justify-center">
                            <BookOpen className="h-3 w-3 text-slate-400" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-semibold text-slate-900 truncate">{book.title}</div>
                            <div className="text-xs text-slate-500 truncate">{book.author}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {filteredBooks.length > 0 && filteredMembers.length > 0 && (
                    <div className="h-px bg-slate-100 my-1 mx-4"></div>
                  )}

                  {filteredMembers.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</div>
                      {filteredMembers.map(member => (
                        <Link 
                          key={member.id} 
                          to="/members" 
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                          onClick={() => setShowResults(false)}
                        >
                          <Avatar fallback={member.fallback} size="sm" />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-semibold text-slate-900 truncate">{member.name}</div>
                            <div className="text-xs text-slate-500 truncate">{member.email}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={notificationsRef}>
            <Button 
              variant="outline" 
              size="icon" 
              className="relative rounded-full text-slate-600 border-slate-200"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#24B1B1] text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-[var(--color-primary)] font-medium hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        onClick={() => handleMarkOneRead(notification.id)}
                        className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notification.unread ? 'bg-teal-50/30' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-sm ${notification.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100">
                  <Button variant="ghost" className="w-full text-xs text-slate-600 h-8" onClick={() => setIsNotificationsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        <div className="relative" ref={profileRef}>
          <button 
            className="flex items-center gap-3 rounded-xl hover:bg-slate-50 p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium leading-none text-slate-900">{profile?.displayName || user?.displayName || "User"}</p>
              <p className="text-xs text-slate-500 mt-1">{role || "Staff"}</p>
            </div>
            <Avatar src={profile?.photoURL || user?.photoURL || undefined} fallback={profile?.displayName ? profile.displayName.substring(0, 2).toUpperCase() : (user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : "U")} />
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                <p className="text-sm font-medium text-slate-900">{profile?.displayName || user?.displayName || "User"}</p>
                <p className="text-xs text-slate-500">{role || "Staff"}</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/settings" 
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile Settings
                </Link>
                <Link 
                  to="/activity" 
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Activity className="h-4 w-4 text-slate-400" />
                  Activity Log
                </Link>
              </div>
              <div className="h-px bg-slate-100 my-1"></div>
              <div className="py-1">
                <button 
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
