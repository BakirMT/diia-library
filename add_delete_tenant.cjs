const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin.tsx', 'utf8');

// 1. Add Trash2 to imports
content = content.replace(
  `import { Shield, Plus, Building2, Clock, CheckCircle2, Edit2, User, Phone, MapPin, Mail, Lock, Eye, EyeOff } from "lucide-react"`,
  `import { Shield, Plus, Building2, Clock, CheckCircle2, Edit2, User, Phone, MapPin, Mail, Lock, Eye, EyeOff, Trash2 } from "lucide-react"`
);
if (!content.includes('Trash2')) {
    content = content.replace(
      `import { Shield, `,
      `import { Shield, Trash2, `
    );
}

// 2. Add handleDeleteLibrary function
const handleSaveFunc = `  const handleSaveLibrary = async () => {`;
const handleDeleteFunc = `  const handleDeleteLibrary = async (libId: string, libName: string) => {
    if (window.confirm(\`Are you sure you want to permanently delete the tenant "\${libName}"? This action cannot be undone.\`)) {
      try {
        await deleteDoc(doc(db, "libraries", libId));
        fetchLibraries();
      } catch (error) {
        console.error("Error deleting tenant:", error);
        alert("Failed to delete tenant.");
      }
    }
  }

  const handleSaveLibrary = async () => {`;
content = content.replace(handleSaveFunc, handleDeleteFunc);

// 3. Update the buttons in the card
const originalButtons = `<div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                    <Button variant="outline" className="flex-1 bg-white border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 1)}>
                      +1 Mnth
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white border-slate-200 hover:bg-slate-100 text-slate-700" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 6)}>
                      +6 Mnth
                    </Button>
                    <Button variant="default" className="flex-1 bg-[var(--color-primary)] hover:bg-teal-700" onClick={() => openEditModal(lib)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </div>`;

const newButtons = `<div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-4 gap-2 shrink-0">
                    <Button variant="outline" className="w-full bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs px-0" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 1)}>
                      +1 Mo
                    </Button>
                    <Button variant="outline" className="w-full bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-xs px-0" onClick={() => handleAddMonths(lib.id, lib.subscriptionEndDate, 6)}>
                      +6 Mo
                    </Button>
                    <Button variant="default" className="w-full bg-[var(--color-primary)] hover:bg-teal-700 text-xs px-0" onClick={() => openEditModal(lib)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 shadow-none text-xs px-0" onClick={() => handleDeleteLibrary(lib.id, lib.name)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>`;
content = content.replace(originalButtons, newButtons);

fs.writeFileSync('src/pages/superadmin.tsx', content);
