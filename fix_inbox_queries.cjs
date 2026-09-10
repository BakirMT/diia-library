const fs = require('fs');

// 1. Fix src/pages/inbox.tsx (Admin/Librarian Inbox)
let inboxContent = fs.readFileSync('src/pages/inbox.tsx', 'utf8');

// The query for Admin/Librarian inbox needs to use getCol instead of generic collection
inboxContent = inboxContent.replace(
  /const q = query\(collection\(db, "messages"\), where\("memberId", "==", activeConversation\.id\)\);/,
  `// Fix: Scoped to the current library via libraryId context in DB
    const currentLibraryId = libraryId || 'default_library';
    const q = query(collection(db, 'libraries', currentLibraryId, 'messages'), where("memberId", "==", activeConversation.id));`
);

fs.writeFileSync('src/pages/inbox.tsx', inboxContent);


// 2. Fix src/pages/student/inbox.tsx (Student Inbox)
let studentInboxContent = fs.readFileSync('src/pages/student/inbox.tsx', 'utf8');

// For student inbox, we also want to scope it properly if possible, but collectionGroup is okay if memberId is unique.
// Let's improve the collectionGroup query to filter by libraryId if we have it, or just use the specific library path.
studentInboxContent = studentInboxContent.replace(
  /const q = query\(collectionGroup\(db, 'messages'\), where\("memberId", "==", memberId\)\);/,
  `// Fix: Scope properly using the student's libraryId
    const currentLibraryId = libraryId || 'default_library';
    const q = query(collection(db, 'libraries', currentLibraryId, 'messages'), where("memberId", "==", memberId));`
);

fs.writeFileSync('src/pages/student/inbox.tsx', studentInboxContent);
