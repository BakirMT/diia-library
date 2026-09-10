const fs = require('fs');

let inboxContent = fs.readFileSync('src/pages/inbox.tsx', 'utf8');

// First, inject `user` from `useAuth`
inboxContent = inboxContent.replace(
  /const \{  role , libraryId \} = useAuth\(\);/,
  `const { user, role, libraryId } = useAuth();`
);

// Next, add state for currentLibrarianDocId
inboxContent = inboxContent.replace(
  /const \[searchQuery, setSearchQuery\] = React\.useState\(''\);/,
  `const [searchQuery, setSearchQuery] = React.useState('');
  const [currentLibrarianDocId, setCurrentLibrarianDocId] = React.useState<string | null>(null);`
);

// We need an effect to resolve the Librarian Doc ID if currentRole is Librarian
const initEffect = `
  React.useEffect(() => {
    const init = async () => {
      if (currentRole === 'Librarian' && user && user.email) {
        // extract username from email
        let username = user.email.split('@')[0];
        if (username.startsWith(libraryId + '-')) {
          username = username.substring(libraryId.length + 1);
        }
        
        const { fetchLibrarians } = await import('@/src/lib/db');
        const librarians = await fetchLibrarians();
        const me = librarians.find(l => l.username?.toLowerCase() === username.toLowerCase());
        if (me) {
          setCurrentLibrarianDocId(me.id);
        }
      }
    };
    init();
  }, [user, currentRole, libraryId]);

  React.useEffect(() => {
    if (currentRole === 'Librarian' && !currentLibrarianDocId) return; // Wait until resolved
    fetchConversations(currentRole, currentLibrarianDocId || '').then(convos => {
`;

inboxContent = inboxContent.replace(
  /React\.useEffect\(\(\) => \{\n\s*fetchConversations\(currentRole\)\.then\(convos => \{/,
  initEffect
);

// Also need to add `currentLibrarianDocId` to the dependency array
inboxContent = inboxContent.replace(
  /  \}, \[currentRole\]\);/,
  `  }, [currentRole, currentLibrarianDocId]);`
);


// Now, fixing `sendMessage`
// In `handleSendMessage`, if we are Librarian and talking to Admin, we act as the "member", so isSender is false, and memberId is our doc ID
const oldSendMessage = /const newMsg = await sendMessage\(activeConversation\.id, text, true, currentRole\);/;

const newSendMessage = `let newMsg;
      if (activeConversation.role === 'Admin') {
        // We are Librarian talking to Admin
        newMsg = await sendMessage(currentLibrarianDocId!, text, false, 'Admin');
      } else if (activeConversation.role === 'Librarian') {
        // We are Admin talking to Librarian
        newMsg = await sendMessage(activeConversation.id, text, true, 'Admin');
      } else {
        // Talking to a Member
        newMsg = await sendMessage(activeConversation.id, text, true, currentRole);
      }`;

inboxContent = inboxContent.replace(oldSendMessage, newSendMessage);

// Also need to fix the listener in `React.useEffect(() => { if (!activeConversation) return; ...`
const oldListener = /const q = query\(collection\(db, 'libraries', currentLibraryId, 'messages'\), where\("memberId", "==", activeConversation\.id\)\);/;

const newListener = `
    let targetMemberId = activeConversation.id;
    let listenTargetRole = currentRole;
    if (activeConversation.role === 'Admin') {
       targetMemberId = currentLibrarianDocId!;
       listenTargetRole = 'Admin';
    } else if (activeConversation.role === 'Librarian') {
       listenTargetRole = 'Admin'; // Admin talking to Librarian uses Admin targetRole
    }
    
    const q = query(collection(db, 'libraries', currentLibraryId, 'messages'), where("memberId", "==", targetMemberId));`;

inboxContent = inboxContent.replace(oldListener, newListener);

const oldFilter = /if \(\(data\.targetRole \|\| 'Admin'\) === currentRole\) \{/;
const newFilter = `if ((data.targetRole || 'Admin') === listenTargetRole) {`;

inboxContent = inboxContent.replace(oldFilter, newFilter);

fs.writeFileSync('src/pages/inbox.tsx', inboxContent);
console.log("Updated inbox.tsx");
