const fs = require('fs');

// 1. Update src/lib/db.ts to fetch Librarians and Admin
let dbContent = fs.readFileSync('src/lib/db.ts', 'utf8');

const oldFetchConversations = /export const fetchConversations = async \(targetRole: 'Admin' \| 'Librarian' = 'Admin'\) => \{[\s\S]*?return convos;\n\};/;

const newFetchConversations = `export const fetchConversations = async (targetRole: 'Admin' | 'Librarian' = 'Admin', currentLibrarianDocId: string = '') => {
  const members = await fetchMembers();
  const librarians = await fetchLibrarians();
  const querySnapshot = await getDocs(getCol("messages"));
  const allMessages: any[] = [];
  querySnapshot.forEach((doc) => {
    allMessages.push({ ...doc.data(), id: doc.id });
  });

  const permittedMembers = members.filter(m => m.status === 'Active' && m.password);
  const convos: any[] = [];

  // Add members
  permittedMembers.forEach((member: any) => {
    const memberMessages = allMessages.filter(m => m.memberId === member.id && (m.targetRole || 'Admin') === targetRole).sort((a, b) => a.timestamp - b.timestamp);
    const lastMsg = memberMessages.length > 0 ? memberMessages[memberMessages.length - 1] : null;
    convos.push({
      id: member.id,
      name: member.name || 'Unknown',
      role: 'Member',
      lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
      time: lastMsg ? lastMsg.time : '',
      timestamp: lastMsg ? lastMsg.timestamp : 0,
      unread: 0,
      online: member.status === 'Active',
      photoURL: member.photoURL || undefined,
      avatar: member.fallback || (member.name ? member.name.substring(0, 2).toUpperCase() : '??')
    });
  });

  if (targetRole === 'Admin') {
    // Add Librarians
    librarians.forEach((lib: any) => {
      const libMessages = allMessages.filter(m => m.memberId === lib.id && (m.targetRole || 'Admin') === 'Admin').sort((a, b) => a.timestamp - b.timestamp);
      const lastMsg = libMessages.length > 0 ? libMessages[libMessages.length - 1] : null;
      convos.push({
        id: lib.id,
        name: lib.name || 'Librarian',
        role: 'Librarian',
        lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
        time: lastMsg ? lastMsg.time : '',
        timestamp: lastMsg ? lastMsg.timestamp : 0,
        unread: 0,
        online: lib.status === 'Active',
        avatar: lib.name ? lib.name.substring(0, 2).toUpperCase() : 'LI'
      });
    });

  } else if (targetRole === 'Librarian') {
    // Add Admin (The Librarian acts as the 'member' with their ID, talking to 'Admin')
    const adminMessages = allMessages.filter(m => m.memberId === currentLibrarianDocId && (m.targetRole || 'Admin') === 'Admin').sort((a, b) => a.timestamp - b.timestamp);
    const lastAdminMsg = adminMessages.length > 0 ? adminMessages[adminMessages.length - 1] : null;
    convos.push({
      id: 'admin',
      name: 'Library Admin',
      role: 'Admin',
      lastMessage: lastAdminMsg ? lastAdminMsg.text : 'No messages yet',
      time: lastAdminMsg ? lastAdminMsg.time : '',
      timestamp: lastAdminMsg ? lastAdminMsg.timestamp : 0,
      unread: 0,
      online: true,
      avatar: 'AD'
    });
  }

  convos.sort((a, b) => b.timestamp - a.timestamp);
  return convos;
};`;

dbContent = dbContent.replace(oldFetchConversations, newFetchConversations);
fs.writeFileSync('src/lib/db.ts', dbContent);
console.log("Updated db.ts");

