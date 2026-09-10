const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin.tsx', 'utf8');

// 1. Add state for delete confirmation
content = content.replace(
  `  const [isModalOpen, setIsModalOpen] = React.useState(false)`,
  `  const [isModalOpen, setIsModalOpen] = React.useState(false)\n  const [libToDelete, setLibToDelete] = React.useState<{id: string, name: string} | null>(null)`
);

// 2. Update handleDeleteLibrary
const oldHandleDelete = `  const handleDeleteLibrary = async (libId: string, libName: string) => {
    if (window.confirm(\`Are you sure you want to permanently delete the tenant "\${libName}"? This action cannot be undone.\`)) {
      try {
        await deleteDoc(doc(db, "libraries", libId));
        fetchLibraries();
      } catch (error) {
        console.error("Error deleting tenant:", error);
        alert("Failed to delete tenant.");
      }
    }
  }`;

const newHandleDelete = `  const handleDeleteLibrary = (libId: string, libName: string) => {
    setLibToDelete({ id: libId, name: libName });
  }

  const confirmDelete = async () => {
    if (!libToDelete) return;
    try {
      await deleteDoc(doc(db, "libraries", libToDelete.id));
      setLibToDelete(null);
      fetchLibraries();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      // Fallback if alert fails
    }
  }`;
content = content.replace(oldHandleDelete, newHandleDelete);

// 3. Add the delete confirmation modal JSX at the very end before the last </div>)}
const deleteModalJsx = `
      {libToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Tenant</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to permanently delete <strong>{libToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setLibToDelete(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
`;

content = content.replace(/    <\/div>\n  \)\n}\s*$/, deleteModalJsx + '    </div>\n  )\n}\n');

fs.writeFileSync('src/pages/superadmin.tsx', content);
