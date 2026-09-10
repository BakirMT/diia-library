const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// Replace collection(db, "...") with getCol("...")
content = content.replace(/collection\(db, ["']([^"']+)["']\)/g, 'getCol("$1")');

// Replace doc(db, "...", id) with getDocRef("...", id)
content = content.replace(/doc\(db, ["']([^"']+)["'], ([^)]+)\)/g, 'getDocRef("$1", $2)');

// Add library context management AFTER replacements so it isn't affected
content = content.replace(
  "export const fetchBooks = async () => {",
  `let currentLibraryId: string | null = 'default_library';
export const setLibraryContext = (id: string | null) => { currentLibraryId = id || 'default_library'; };

const getCol = (colName: string) => {
  return collection(db, 'libraries', currentLibraryId!, colName);
};
const getDocRef = (colName: string, id: string) => {
  return doc(db, 'libraries', currentLibraryId!, colName, id);
};

export const fetchBooks = async () => {`
);

fs.writeFileSync('src/lib/db.ts', content);
