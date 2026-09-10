const fs = require('fs');
let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

const oldSnapshot = `            } else {
               const lid = data.libraryId || 'default_library';
               const libSnap = await getDoc(doc(db, 'libraries', lid));
               if (libSnap.exists()) {`;

const newSnapshot = `            } else {
               const lid = data.libraryId || 'default_library';
               setLibraryId(lid);
               setLibraryContext(lid);
               const libSnap = await getDoc(doc(db, 'libraries', lid));
               if (libSnap.exists()) {`;

content = content.replace(oldSnapshot, newSnapshot);
fs.writeFileSync('src/lib/AuthContext.tsx', content);
