const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

const oldFetchConversations = `export const fetchConversations = async (targetRole: 'Admin' | 'Librarian' = 'Admin') => {
  const members = await fetchMembers();
  // We can fetch all messages to get the last message for each member, or just return members as conversations.
  const querySnapshot = await getDocs(getCol("messages"));
  const messages: any[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if ((data.targetRole || 'Admin') === targetRole) {
      messages.push({ ...data, id: doc.id });
    }
  });

  // Only allow members with Active status and a password to use chat
  const permittedMembers = members.filter(m => m.status === 'Active' && m.password);
  
  const convos = permittedMembers.map((member: any) => {
    const memberMessages = messages.filter(m => m.memberId === member.id).sort((a, b) => a.timestamp - b.timestamp);
    const lastMsg = memberMessages.length > 0 ? memberMessages[memberMessages.length - 1] : null;

    return {
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
    };
  });
    
  // Sort by timestamp descending
  convos.sort((a, b) => b.timestamp - a.timestamp);
    
  return convos;
};`;

const newFetchConversations = `export const fetchConversations = async (targetRole: 'Admin' | 'Librarian' = 'Admin', currentUserId: string = '') => {
  const members = await fetchMembers();
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
    const librarians = await fetchLibrarians();
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
        avatar: lib.name ? lib.name.substring(0, 2).toUpperCase() : 'L'
      });
    });

    // Add SuperAdmin
    const saMessages = allMessages.filter(m => m.memberId === 'superadmin' && (m.targetRole || 'Admin') === 'Admin').sort((a, b) => a.timestamp - b.timestamp);
    const lastSAMsg = saMessages.length > 0 ? saMessages[saMessages.length - 1] : null;
    convos.push({
      id: 'superadmin',
      name: 'Main Admin',
      role: 'SuperAdmin',
      lastMessage: lastSAMsg ? lastSAMsg.text : 'No messages yet',
      time: lastSAMsg ? lastSAMsg.time : '',
      timestamp: lastSAMsg ? lastSAMsg.timestamp : 0,
      unread: 0,
      online: true,
      avatar: 'SA'
    });
  } else if (targetRole === 'Librarian') {
    // Add Admin (The Librarian acts as the 'member' with their ID, talking to 'Admin')
    const adminMessages = allMessages.filter(m => m.memberId === currentUserId && (m.targetRole || 'Admin') === 'Admin').sort((a, b) => a.timestamp - b.timestamp);
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

content = content.replace(oldFetchConversations, newFetchConversations);
fs.writeFileSync('src/lib/db.ts', content);
