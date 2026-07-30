import * as React from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Bookmark, Clock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/src/lib/AuthContext"
import { db } from "@/src/lib/firebase"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { fetchReservationsByMember, deleteReservation, updateBook, fetchActivities } from "@/src/lib/db"


export default function StudentReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [currentCheckoutsByTitle, setCurrentCheckoutsByTitle] = React.useState<Map<string, string[]>>(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  const handleCancel = async (res: any) => {
    try {
      const reservationId = res.id;
      if (!reservationId) {
        console.error("No reservation ID found for:", res);
        return;
      }
      
      console.log("Attempting to delete reservation:", reservationId);
      await deleteReservation(reservationId);
      
      // Update the book's availability if possible
      if (res.bookId) {
        try {
          const bookDoc = await getDoc(doc(db, 'books', res.bookId));
          if (bookDoc.exists()) {
            const bookData = bookDoc.data();
            // Increment available copies and reset status if it was 'Reserved'
            const newCopiesAvailable = (bookData.copiesAvailable || 0) + 1;
            const updates: any = { copiesAvailable: newCopiesAvailable };
            if (bookData.status === 'Reserved') {
              updates.status = 'Available';
            }
            await updateBook(res.bookId, updates);
          }
        } catch (bookErr) {
          console.error("Error updating book status:", bookErr);
        }
      }
      
      setReservations(prev => prev.filter(r => r.id !== reservationId));
    } catch (err) {
      console.error("Error in handleCancel:", err);
      alert("Failed to cancel reservation. Please try again.");
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const membersSnap = await getDocs(collection(db, 'members'));
        const membersMap = new Map<string, any>();
        let memberId = user.uid;

        const isEmailMatch = (email1: string, email2: string) => {
          if (!email1 || !email2) return false;
          const clean = (e: string) => e.toLowerCase().trim().replace('@gmai.com', '@gmail.com');
          return clean(email1) === clean(email2);
        };

        membersSnap.forEach(d => {
          const data = d.data();
          membersMap.set(d.id, data);
          const safeId = d.id.replace(/[^a-zA-Z0-9]/g, '');
          const internalEmail = `${safeId}@v2.member.libsys.local`;
          if (
            (userData?.username && data.username?.toLowerCase() === userData.username.toLowerCase()) ||
            (userData?.email && isEmailMatch(data.email, userData.email)) ||
            (user.email && isEmailMatch(data.email, user.email)) ||
            user.email === internalEmail
          ) {
            memberId = d.id;
          }
        });
        
        const resList = await fetchReservationsByMember(memberId);
        setReservations(resList);

        const activities = await fetchActivities();
        const checkouts = new Map<string, string>();
        const sorted = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sorted.forEach(act => {
          if (!act.memberId || !act.bookTitle) return;
          const key = `${act.memberId}::${act.bookTitle}`;
          if (act.action === 'Check Out') {
            checkouts.set(key, act.memberName || membersMap.get(act.memberId)?.name || 'Unknown Member');
          } else if (act.action === 'Check In') {
            checkouts.delete(key);
          }
        });
        
        const byTitle = new Map<string, string[]>();
        checkouts.forEach((memberName, key) => {
          const title = key.split('::')[1];
          if (!byTitle.has(title)) byTitle.set(title, []);
          if (!byTitle.get(title)!.includes(memberName)) {
             byTitle.get(title)!.push(memberName);
          }
        });
        setCurrentCheckoutsByTitle(byTitle);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Reservations</h2>
          <p className="text-sm text-slate-500">Track the status of books you've requested.</p>
        </div>
      </div>

      <div className="space-y-4">
        {reservations.map((res) => (
          <Card key={res.id}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-[var(--color-primary)]'}`}>
                  {(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{res.title}</h3>
                      <p className="text-sm text-slate-500">by {res.author}</p>
                      {currentCheckoutsByTitle.get(res.title) && currentCheckoutsByTitle.get(res.title)!.length > 0 && (
                        <p className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                          Checked out by: {currentCheckoutsByTitle.get(res.title)!.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'}`}>
                        {(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? 'reservation accepted' : res.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <div>
                      <span className="font-medium text-slate-700">Requested:</span> {res.date}
                    </div>
                    {(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? (
                      <div>
                        <span className="font-medium text-slate-700">Pickup by:</span> {res.expires || 'Available Now'}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium text-slate-700">Queue Position:</span> #{res.position}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  {(res.status === 'Ready for pickup' || res.status === 'Fulfilled') ? (
                    <Button className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-teal-600">Got it</Button>
                  ) : (
                    confirmingId === res.id ? (
                      <div className="flex sm:flex-col gap-2">
                        <Button 
                          variant="destructive" 
                          className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700"
                          onClick={() => {
                            handleCancel(res);
                            setConfirmingId(null);
                          }}
                        >
                          Yes, Cancel
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-50"
                          onClick={() => setConfirmingId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                        onClick={() => setConfirmingId(res.id)}
                      >
                        Cancel Request
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reservations.length === 0 && !isLoading && (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-xl">
            <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No active reservations</h3>
            <p className="text-sm text-slate-500 mt-1">You haven't reserved any books yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
