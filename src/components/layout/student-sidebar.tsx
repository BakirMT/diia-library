import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/src/lib/utils"
import { useAuth } from "@/src/lib/AuthContext"
import { 
  Library,
  BookOpen,
  Search,
  Bookmark,
  History,
  Settings,
  X,
  MessageSquare
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/src/lib/firebase"

const navItems = [
  { name: 'My Dashboard', path: '/student', icon: BookOpen },
  { name: 'Browse Catalog', path: '/student/catalog', icon: Search },
  { name: 'Reservations', path: '/student/reservations', icon: Bookmark },
  { name: 'Loans & Fines', path: '/student/loans', icon: History },
  { name: 'Settings', path: '/student/settings', icon: Settings },
  { name: 'Chat', path: '/student/inbox', icon: MessageSquare },
]

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentSidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const [memberId, setMemberId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const resolveUser = async () => {
      if (!user) return;
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
        console.error("Error resolving member ID for student sidebar", err);
      }
    };
    resolveUser();
  }, [user]);

  React.useEffect(() => {
    if (!memberId) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', memberId),
      where('unread', '==', true),
      where('type', '==', 'message')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadChatCount(snapshot.docs.length);
    }, (error) => {
      console.error("Error listening to unread chat count:", error);
    });

    return () => unsubscribe();
  }, [memberId]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--color-border)]">
          <Link to="/student" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-orange-200">
              <Library className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">Libra</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                    isActive 
                      ? "bg-orange-50 text-[var(--color-primary)] font-semibold" 
                      : "text-slate-500 hover:text-slate-900 font-medium"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-[var(--color-primary)]" : "text-slate-400")} />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Chat' && unreadChatCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-[#F4772D] px-2 py-0.5 text-xs font-medium text-white">
                      {unreadChatCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
                <div className="mt-auto border-t border-slate-100 p-4">
          <button onClick={logout} className="w-full rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">
            Log out
          </button>
        </div>
      </div>
    </>
  )
}
