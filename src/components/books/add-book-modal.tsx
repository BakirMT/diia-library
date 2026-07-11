import * as React from "react"
import { X, Upload } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { useSettings } from "@/src/lib/SettingsContext"

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (bookData: any) => void;
  initialData?: any;
}

export function AddBookModal({ isOpen, onClose, onSave, initialData }: AddBookModalProps) {
  const { settings } = useSettings();
  const [formData, setFormData] = React.useState({
    title: '', author: '', isbn: '', category: '', tags: [] as string[], publisher: '', publishYear: '', language: '', pages: '', shelfLocation: '', copiesTotal: 1, status: 'Available', resourceLink: '', synopsis: ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    } else {
      setFormData({ title: '', author: '', isbn: '', category: '', tags: [], publisher: '', publishYear: '', language: '', pages: '', shelfLocation: '', copiesTotal: 1, status: 'Available', resourceLink: '', synopsis: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{initialData ? 'Edit Book' : 'Add New Book'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
          <form className="space-y-6">
            {/* Cover Upload */}
            <div className="flex items-start gap-6">
              <div className="w-32 h-48 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden shrink-0">
                {(formData as any).cover ? (
                  <img src={(formData as any).cover} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="text-[10px] font-medium text-center px-2">No Cover</span>
                  </>
                )}
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cover Image URL</label>
                  <Input value={(formData as any).cover || ''} onChange={e => setFormData({ ...formData, cover: e.target.value })} placeholder="https://example.com/image.jpg" type="url" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Book Title <span className="text-red-500">*</span></label>
                  <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Enter book title" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Author <span className="text-red-500">*</span></label>
                  <Input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="Author name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">ISBN / Book ID</label>
                  <Input value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} placeholder="e.g. 978-3-16-148410-0" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Category / Genre</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                  <option value="">Select category</option>
                  {(settings.categories || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tags (comma separated)</label>
                <Input value={formData.tags?.join(', ') || ''} onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="e.g. Sci-Fi, Dystopian" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Publisher</label>
                <Input value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} placeholder="Publisher name" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Publish Year</label>
                <Input value={formData.publishYear} onChange={e => setFormData({ ...formData, publishYear: e.target.value })} type="number" placeholder="YYYY" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Language</label>
                <Input value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} placeholder="e.g. English" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pages</label>
                <Input value={formData.pages} onChange={e => setFormData({ ...formData, pages: e.target.value })} type="number" placeholder="Number of pages" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Shelf Location</label>
                <Input value={formData.shelfLocation} onChange={e => setFormData({ ...formData, shelfLocation: e.target.value })} placeholder="e.g. A1-S2" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Copies <span className="text-red-500">*</span></label>
                <Input value={formData.copiesTotal} onChange={e => setFormData({ ...formData, copiesTotal: parseInt(e.target.value) || 1 })} type="number" min={1} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200">
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              
              <div className="space-y-2 lg:col-span-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Resource / Purchase Link</label>
                <Input value={formData.resourceLink} onChange={e => setFormData({ ...formData, resourceLink: e.target.value })} type="url" placeholder="https://" />
              </div>
              
              <div className="space-y-2 lg:col-span-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Synopsis / Description</label>
                <textarea 
                  value={formData.synopsis} onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
                  className="flex w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm text-[var(--color-text-main)] outline-none transition-colors placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-200 min-h-[100px] resize-y" 
                  placeholder="Brief description of the book..."
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={() => { if (onSave) onSave(formData); else onClose(); }} className="rounded-full px-6">{initialData ? 'Update Book' : 'Save Book'}</Button>
        </div>
      </div>
    </div>
  )
}
