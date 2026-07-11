import * as React from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Search, Filter, BookOpen } from "lucide-react"
import { fetchBooks, addReservation, updateBook, addBook, addNotification } from "@/src/lib/db"
import { useAuth } from "@/src/lib/AuthContext"
import { db } from "@/src/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { Badge } from "@/src/components/ui/badge"
import { Plus } from "lucide-react"
import { AddBookModal } from "@/src/components/books/add-book-modal"


export default function StudentCatalog() {
  const { user, profile } = useAuth();
  
  const handleReserve = async (book: any) => {
    if (!user) {
      alert("Please log in to reserve books.");
      return;
    }

    if (book.copiesAvailable === 0 || book.status === 'Checked Out') {
      alert("This book is unavailable for reservation.");
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      let memberId = user.uid;
      
      const membersSnap = await getDocs(collection(db, 'members'));

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
          memberId = d.id;
        }
      });
      
      const reservation = {
        id: `RES-${Date.now()}`,
        bookId: book.id,
        title: book.title,
        author: book.author,
        memberId: memberId,
        date: new Date().toISOString().split('T')[0],
        status: 'In Queue',
        position: 1
      };
      
      await addReservation(reservation);

      await addNotification({
        userId: 'admin',
        title: 'New Reservation Request',
        message: `${profile?.displayName || user?.displayName || user?.email || 'A member'} has reserved "${book.title}".`,
        type: 'reservation'
      });
      
      // Update book status and copies
      const newCopiesAvailable = Math.max(0, (book.copiesAvailable || 1) - 1);
      const updates = { 
        copiesAvailable: newCopiesAvailable,
        status: newCopiesAvailable === 0 ? 'Reserved' : book.status 
      };
      
      await updateBook(book.id, updates);
      
      // Update local state
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, ...updates } : b));
      
      alert(`Successfully reserved "${book.title}" for pickup.`);
    } catch (err) {
      console.error(err);
      alert("Failed to reserve book.");
    }
  };
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [books, setBooks] = React.useState<any[]>([]);
  const { role } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  
  const handleSaveBook = async (bookData: any) => {
    try {
      const saved = await addBook(bookData);
      setBooks(prev => [saved, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add book");
    }
  };

  React.useEffect(() => {
    fetchBooks().then(setBooks);
  }, []);
  
  const allCategories = React.useMemo(() => {
    return Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();
  }, [books]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = String(book.title || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) || 
                          String(book.author || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) ||
                          String(book.category || '').toLowerCase().includes(String(searchTerm || '').toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse Catalog</h2>
          <p className="text-sm text-slate-500">Discover your next great read.</p>
        </div>
        {(role === 'Admin' || role === 'Librarian') && (
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--color-primary)] hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" /> Add Book
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
        <div className="flex items-center gap-2 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by title, author, or category..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full sm:w-48 shrink-0 rounded-md bg-white border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          <option value="All">All Categories</option>
          {allCategories.map(cat => (
            <option key={String(cat)} value={String(cat)}>{String(cat)}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 flex items-center justify-center p-6 shrink-0">
               <div className="w-24 h-32 bg-slate-200 shadow-sm rounded-md flex items-center justify-center overflow-hidden">
                 {book.cover || book.imageUrl ? (
                   <img src={book.cover || book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                 ) : (
                   <BookOpen className="h-8 w-8 text-slate-400" />
                 )}
               </div>
            </div>
            <CardContent className="p-5 flex flex-col flex-1">
              <div className="mb-2">
                <Badge 
                  variant={
                    (book.copiesAvailable === 0 || book.status === 'Checked Out') ? 'destructive' : 
                    book.status === 'Available' ? 'success' : 
                    book.status === 'Reserved' ? 'warning' : 'secondary'
                  } 
                  className="text-[10px] mb-2"
                >
                  {book.copiesAvailable === 0 && book.status !== 'Reserved' ? 'Checked Out' : book.status}
                </Badge>
                <h3 className="font-bold text-slate-900 line-clamp-1" title={book.title}>{book.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{book.author}</p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{book.category}</span>
                <Button 
                  size="sm" 
                  onClick={() => handleReserve(book)}
                  variant={(book.copiesAvailable > 0 && book.status !== 'Checked Out') ? "default" : "outline"} 
                  disabled={book.copiesAvailable === 0 || book.status === 'Checked Out'} 
                  className={(book.copiesAvailable > 0 && book.status !== 'Checked Out') ? "bg-[var(--color-primary)] hover:bg-orange-600" : ""}
                >
                  {(book.copiesAvailable > 0 && book.status !== 'Checked Out') ? 'Reserve' : 'Unavailable'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AddBookModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleSaveBook} 
      />
    </div>
  )
}
