import * as React from "react"
import { Plus, Search, Filter, Edit2, Trash2, BookOpen, Upload, Download } from "lucide-react"
import { exportToCSV } from "@/src/lib/export"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { AddBookModal } from "@/src/components/books/add-book-modal"
import { BulkImportModal } from "@/src/components/shared/bulk-import-modal"
import { useSettings } from "@/src/lib/SettingsContext"
import { fetchBooks, addBook, updateBook, deleteBook, addBooksBulk } from "@/src/lib/db"

export default function Books() {
  const { settings } = useSettings();
  const [books, setBooks] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = React.useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<any>(null);
  const [deletingBook, setDeletingBook] = React.useState<{id: string, title: string} | null>(null);
  const [selectedTag, setSelectedTag] = React.useState<string>('All');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBookIds, setSelectedBookIds] = React.useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);

  React.useEffect(() => {
    fetchBooks().then(fetchedBooks => {
      setBooks(fetchedBooks);
      setIsLoading(false);
    });
  }, []);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    books.forEach(b => {
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach((t: string) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [books]);

  const filteredBooks = books.filter(b => {
    const matchesSearch = !searchQuery || 
      String(b.title || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) || 
      String(b.author || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
      String(b.isbn || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
      
    const matchesTag = selectedTag === 'All' || (b.tags && Array.isArray(b.tags) && b.tags.includes(selectedTag));
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    
    return matchesSearch && matchesTag && matchesCategory;
  });

  const handleDeleteConfirm = async () => {
    if (deletingBook) {
      try {
        await deleteBook(deletingBook.id);
        setBooks(prev => prev.filter(book => String(book.id) !== String(deletingBook.id)));
        setDeletingBook(null);
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const toggleSelectAll = () => {
    const selectableBooks = filteredBooks.filter(b => !(b.copiesAvailable === 0 || b.status === 'Checked Out'));
    if (selectedBookIds.length === selectableBooks.length && selectableBooks.length > 0) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(selectableBooks.map(b => b.id));
    }
  };

  const toggleSelectBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBookIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedBookIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const id of selectedBookIds) {
        await deleteBook(id);
      }
      setBooks(prev => prev.filter(b => !selectedBookIds.includes(String(b.id))));
      setSelectedBookIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (e: any) {
      alert("Failed to delete some books: " + e.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const [exportStatus, setExportStatus] = React.useState('');

  const handleExport = () => {
    const dataToExport = filteredBooks.map(book => ({
      'Cover Image URL': book.coverUrl || '',
      'Book Title *': book.title || '',
      'Author *': book.author || '',
      'ISBN / Book ID': book.isbn || book.id || '',
      'Category / Genre': book.category || '',
      'Tags (comma separated)': Array.isArray(book.tags) ? book.tags.join(', ') : '',
      'Publisher': book.publisher || '',
      'Publish Year': book.publishYear || '',
      'Language': book.language || '',
      'Pages': book.pages || '',
      'Shelf Location': book.shelfLocation || '',
      'Total Copies *': book.copiesTotal || 0,
      'Status': book.status || '',
      'Resource / Purchase Link': book.resourceLink || '',
      'Synopsis / Description': book.description || '',
    }));
    
    const success = exportToCSV(dataToExport, "library_books_export.csv");
    if (success) {
      setExportStatus('Export successful! (If it did not download, open app in a new tab)');
    } else {
      setExportStatus('Export failed. Please check browser permissions.');
    }
    setTimeout(() => setExportStatus(''), 6000);
  };

  return (
    <div className="space-y-6">
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingBook(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete "{deletingBook.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingBook(null)}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteConfirm}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Bulk Deletion</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete {selectedBookIds.length} selected books? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)} disabled={isBulkDeleting}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleBulkDeleteConfirm} disabled={isBulkDeleting}>
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type="books"
        onImport={async (data) => {
          try {
            setIsLoading(true);
            const parsedBooks = [];
            for (const d of data) {
              const title = d.title || d.Title || d['Book Title *'] || d['Book Title'] || '';
              if (!title || title.trim() === '') continue;

              const copiesTotal = Number(d.copiesTotal || d['Total Copies'] || d['Total Copies *']) || 1;
              const copiesAvailable = Number(d.copiesAvailable || d['Available Copies']) || copiesTotal;
              
              let tags = d.tags || d.Tags || d['Tags (comma separated)'];
              if (typeof tags === 'string') {
                tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
              }

              const newBook = {
                title: title,
                author: d.author || d.Author || d['Author *'] || d['Author'] || '',
                category: d.category || d.Category || d['Category / Genre'] || '',
                tags: tags || [],
                isbn: d.isbn || d.ISBN || d['ISBN / Book ID'] || '',
                publisher: d.publisher || d.Publisher || '',
                publishYear: d.publishYear || d['Publish Year'] || '',
                language: d.language || d.Language || '',
                pages: d.pages || d.Pages || '',
                shelfLocation: d.shelfLocation || d['Shelf Location'] || '',
                copiesTotal,
                copiesAvailable,
                status: d.status || d.Status || 'Available',
                coverUrl: d.coverUrl || d['Cover Image URL'] || '',
                resourceLink: d.resourceLink || d['Resource / Purchase Link'] || '',
                description: d.description || d['Synopsis / Description'] || '',
              };
              
              Object.keys(newBook).forEach((key) => {
                if (newBook[key as keyof typeof newBook] === undefined) {
                  delete newBook[key as keyof typeof newBook];
                }
              });
              
              parsedBooks.push(newBook);
            }
            
            const savedBooks = await addBooksBulk(parsedBooks);
            setBooks(prev => [...savedBooks, ...prev]);
            setIsLoading(false);
          } catch (error: any) {
            console.error("Failed to import books:", error);
            alert("Failed to import books: " + error.message);
            setIsLoading(false);
          }
        }}
      />
      <AddBookModal 
        isOpen={isAddBookModalOpen} 
        onClose={() => setIsAddBookModalOpen(false)} 
        onSave={async (bookData) => {
          try {
            const newBook = { ...bookData, copiesAvailable: bookData.copiesTotal, status: 'Available' };
            // Remove undefined values just in case
            Object.keys(newBook).forEach(key => newBook[key] === undefined && delete newBook[key]);
            const savedBook = await addBook(newBook);
            setBooks([savedBook, ...books]);
            setIsAddBookModalOpen(false);
          } catch (error: any) {
            console.error("Failed to save book:", error);
            alert("Failed to save book: " + error.message);
          }
        }}
      />
      <AddBookModal 
        isOpen={!!editingBook} 
        onClose={() => setEditingBook(null)} 
        initialData={editingBook}
        onSave={async (bookData) => {
          try {
            // Remove undefined values just in case
            Object.keys(bookData).forEach(key => bookData[key] === undefined && delete bookData[key]);
            await updateBook(editingBook.id, bookData);
            setBooks(books.map(b => b.id === editingBook.id ? { ...b, ...bookData } : b));
            setEditingBook(null);
          } catch (error: any) {
            console.error("Failed to update book:", error);
            alert("Failed to update book: " + error.message);
          }
        }}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Books Management</h2>
          <p className="text-sm text-slate-500">Manage the library's catalog and inventory.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {selectedBookIds.length > 0 && (
            <Button variant="destructive" onClick={() => setIsBulkDeleteModalOpen(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedBookIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto text-slate-600">
            <Download className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setIsAddBookModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Book
          </Button>
        </div>
      </div>
      
      {exportStatus && (
        <div className={`p-3 rounded-md text-sm ${String(exportStatus || '').includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {exportStatus}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={
                filteredBooks.filter(b => !(b.copiesAvailable === 0 || b.status === 'Checked Out')).length > 0 &&
                selectedBookIds.length === filteredBooks.filter(b => !(b.copiesAvailable === 0 || b.status === 'Checked Out')).length
              }
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span>Select All</span>
          </label>
        </div>
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <Input 
            placeholder="Search by title, author, or ISBN..." 
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-50 border-transparent focus-visible:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex h-10 w-full sm:w-48 rounded-full bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200"
          >
            <option value="All">All Categories</option>
            {(settings.categories || []).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="flex h-10 w-full sm:w-48 rounded-full bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200"
          >
            <option value="All">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBooks.map((book) => {
          const isCheckedOut = book.copiesAvailable === 0 || book.status === 'Checked Out';
          return (
            <Card key={book.id} className={`overflow-hidden flex flex-col transition-colors ${isCheckedOut ? 'opacity-90' : 'cursor-pointer hover:border-[var(--color-primary)]'} ${selectedBookIds.includes(book.id) ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : ''}`}>
              <div className="h-48 bg-slate-100 relative flex items-center justify-center border-b border-[var(--color-border)] p-4" onClick={() => { if (!isCheckedOut) setEditingBook(book); }}>
                <div className="absolute top-3 left-3 z-10" onClick={(e) => { if (!isCheckedOut) toggleSelectBook(book.id, e); else e.stopPropagation(); }}>
                  <input 
                    type="checkbox" 
                    checked={selectedBookIds.includes(book.id)}
                    onChange={() => {}}
                    disabled={isCheckedOut}
                    className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-5 h-5 cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {/* Fallback cover */}
                <div className="w-24 h-36 bg-slate-300 rounded shadow-md flex items-center justify-center relative overflow-hidden">
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={
                      isCheckedOut ? 'destructive' :
                      book.status === 'Available' ? 'success' : 
                      book.status === 'Reserved' ? 'warning' : 'secondary'
                    }
                  >
                    {isCheckedOut ? 'Checked Out' : book.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-primary)] font-medium mb-1">{book.category}</div>
                  <h3 className="font-semibold text-[var(--color-text-main)] line-clamp-1" title={book.title}>{book.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-1 mb-3">{book.author}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.tags && Array.isArray(book.tags) && book.tags.map((tag: string) => (
                      <div key={tag}>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">ISBN: {book.isbn}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Shelf: {book.shelfLocation}</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <div className="text-sm">
                    <span className={`font-semibold ${(!isCheckedOut && book.copiesAvailable > 0) ? 'text-green-600' : 'text-red-600'}`}>
                      {(!isCheckedOut && book.copiesAvailable > 0) ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {!isCheckedOut && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setEditingBook(book); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeletingBook({id: book.id, title: book.title}); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
