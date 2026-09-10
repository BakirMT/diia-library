const safeGetStorage = (key: string) => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const safeSetStorage = (key: string, val: string) => {
  try { localStorage.setItem(key, val); } catch (e) {}
};
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_BOOKS, MOCK_MEMBERS } from './mock-data';

let currentLibraryId: string | null = 'default_library';
export const setLibraryContext = (id: string | null) => { currentLibraryId = id || 'default_library'; };

const getCol = (colName: string) => {
  return collection(db, 'libraries', currentLibraryId, colName);
};
const getDocRef = (colName: string, id: string) => {
  return getDocRef("libraries", currentLibraryId, colName, id);
};

export const fetchBooks = async () => {
  const querySnapshot = await getDocs(getCol("books"));
  const books: any[] = [];
  querySnapshot.forEach((doc) => {
    books.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('books_seeded');
  if (books.length === 0 && !seeded) {
    console.log("No books found, seeding...");
    for (const book of MOCK_BOOKS) {
      await setDoc(getDocRef("books", book.id), book);
      books.push(book);
    }
    safeSetStorage('books_seeded', 'true');
  }
  return books;
};

export const fetchMembers = async () => {
  const querySnapshot = await getDocs(getCol("members"));
  const members: any[] = [];
  querySnapshot.forEach((doc) => {
    members.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('members_seeded');
  if (members.length === 0 && !seeded) {
    console.log("No members found, seeding...");
    for (const member of MOCK_MEMBERS) {
      await setDoc(getDocRef("members", member.id), member);
      members.push(member);
    }
    safeSetStorage('members_seeded', 'true');
  }
  return members;
};

export const addBook = async (book: any) => {
  const docRef = await addDoc(getCol("books"), book);
  return { ...book, id: docRef.id };
};

export const addMember = async (member: any) => {
  if (member.id) {
    await setDoc(getDocRef("members", member.id), member);
    return member;
  } else {
    const docRef = await addDoc(getCol("members"), member);
    return { ...member, id: docRef.id };
  }
};

export const updateMember = async (id: string, updates: any) => {
  await updateDoc(getDocRef("members", id), updates);
};

export const deleteMember = async (id: string) => {
  try {
    // Delete activities
    const actsQuery = query(getCol("activities"), where("memberId", "==", id));
    const actsSnap = await getDocs(actsQuery);
    const actPromises = actsSnap.docs.map(d => deleteDoc(getDocRef("activities", d.id)));

    // Delete fines
    const finesQuery = query(getCol("fines"), where("memberId", "==", id));
    const finesSnap = await getDocs(finesQuery);
    const finePromises = finesSnap.docs.map(d => deleteDoc(getDocRef("fines", d.id)));

    // Delete reservations
    const resQuery = query(getCol("reservations"), where("memberId", "==", id));
    const resSnap = await getDocs(resQuery);
    const resPromises = resSnap.docs.map(d => deleteDoc(getDocRef("reservations", d.id)));

    // Delete messages
    const msgQuery = query(getCol("messages"), where("memberId", "==", id));
    const msgSnap = await getDocs(msgQuery);
    const msgPromises = msgSnap.docs.map(d => deleteDoc(getDocRef("messages", d.id)));

    // Delete notifications
    const notifQuery = query(getCol("notifications"), where("userId", "==", id));
    const notifSnap = await getDocs(notifQuery);
    const notifPromises = notifSnap.docs.map(d => deleteDoc(getDocRef("notifications", d.id)));

    await Promise.all([
      ...actPromises,
      ...finePromises,
      ...resPromises,
      ...msgPromises,
      ...notifPromises
    ]);

    // Finally, delete the member
    await deleteDoc(getDocRef("members", id));
  } catch (err) {
    console.error("Error cascading delete for member:", err);
    throw err;
  }
};


export const updateBook = async (id: string, updates: any) => {
  await updateDoc(getDocRef("books", id), updates);
};

export const deleteBook = async (id: string) => {
  await deleteDoc(getDocRef("books", id));
};
export const fetchActivities = async () => {
  const querySnapshot = await getDocs(getCol("activities"));
  const activities: any[] = [];
  querySnapshot.forEach((doc) => {
    activities.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('activities_seeded');
  if (activities.length === 0 && !seeded) {
    console.log("No activities found, seeding...");
    const { MOCK_ACTIVITIES } = await import('./mock-data');
    for (const activity of MOCK_ACTIVITIES) {
      await setDoc(getDocRef("activities", activity.id), activity);
      activities.push(activity);
    }
    safeSetStorage('activities_seeded', 'true');
  }
  return activities;
};

export const fetchMessages = async (memberId: string, targetRole: 'Admin' | 'Librarian' = 'Admin') => {
  const querySnapshot = await getDocs(getCol("messages"));
  const messages: any[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.memberId === memberId && (data.targetRole || 'Admin') === targetRole) {
      messages.push({ id: doc.id, ...data });
    }
  });
  // sort by timestamp
  messages.sort((a, b) => a.timestamp - b.timestamp);
  return messages;
};

export const sendMessage = async (memberId: string, text: string, isSender: boolean, targetRole: 'Admin' | 'Librarian' = 'Admin', metadata?: any) => {
  const newMsg: any = {
    memberId,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    isSender,
    targetRole,
  };
  if (metadata) {
    newMsg.metadata = metadata;
  }
  const docRef = await addDoc(getCol("messages"), newMsg);

  try {
    if (!isSender) {
      // Sent by member -> notify admin
      let memberName = 'A member';
      try {
        const memberSnap = await getDoc(getDocRef("members", memberId));
        if (memberSnap.exists()) {
          memberName = memberSnap.data().name || 'A member';
        }
      } catch (e) {
        console.error("Error fetching member for notification", e);
      }
      await addNotification({
        userId: targetRole.toLowerCase(),
        title: 'New Message',
        message: `New message from ${memberName}: "${text}"`,
        type: 'message'
      });
    } else {
      // Sent by admin/librarian -> notify the specific member
      await addNotification({
        userId: memberId,
        title: `New Message from ${targetRole}`,
        message: `${targetRole}: "${text}"`,
        type: 'message'
      });
    }
  } catch (err) {
    console.error("Error sending message notification:", err);
  }
  return { id: docRef.id, ...newMsg };
};

export const fetchConversations = async (targetRole: 'Admin' | 'Librarian' = 'Admin') => {
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
};

export const addBooksBulk = async (books: any[]) => {
  const chunks = [];
  const chunkSize = 400; // Safe limit below 500
  for (let i = 0; i < books.length; i += chunkSize) {
    chunks.push(books.slice(i, i + chunkSize));
  }
  
  const savedBooks: any[] = [];
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(book => {
      const newRef = doc(getCol("books"));
      batch.set(newRef, book);
      savedBooks.push({ ...book, id: newRef.id });
    });
    await batch.commit();
  }
  return savedBooks;
};


export const addReservation = async (reservation: any) => {
  try {
    const docRef = await addDoc(getCol("reservations"), reservation);
    return { ...reservation, id: docRef.id };
  } catch (error) {
    console.error("Error adding reservation:", error);
    throw error;
  }
}

export const permitReservation = async (reservationId: string, bookId: string, memberId: string, messageId: string, permittedBy: string) => {
  try {
    // 1. Get the book
    const bookSnap = await getDoc(getDocRef("books", bookId));
    if (!bookSnap.exists()) throw new Error("Book not found");
    const book = bookSnap.data();

    // 2. Add checkout activity
    const today = new Date();
    
    // Fetch member to get their name
    const memberSnap = await getDoc(getDocRef("members", memberId));
    const memberName = memberSnap.exists() ? memberSnap.data().name : 'Unknown';

    const checkoutRecord = {
      id: `ACT-${Date.now()}`,
      memberId,
      memberName,
      bookTitle: book.title,
      action: 'Check Out',
      date: today.toISOString(),
      status: 'Completed',
      permittedBy
    };
    await addDoc(getCol("activities"), checkoutRecord);

    // 3. Update reservation status to Completed
    try {
      await updateDoc(getDocRef("reservations", reservationId), { status: 'Completed' });
    } catch (err: any) {
      console.warn("Direct update failed, querying for reservation ID", err);
      const q = query(getCol("reservations"), where("id", "==", reservationId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(getDocRef("reservations", snap.docs[0].id), { status: 'Completed' });
      } else {
        throw new Error("Reservation document not found by ID or query.");
      }
    }

    // 4. Update book status to Checked Out if copies reached 0
    try {
      await updateDoc(getDocRef("books", bookId), {
        status: book.copiesAvailable === 0 ? 'Checked Out' : book.status
      });
    } catch (e) {
      console.error("Failed to update book status", e);
    }

    // 5. Update the message metadata to show it was permitted for all related messages
    const qMsgs = query(getCol("messages"), where("memberId", "==", memberId));
    const msgsSnap = await getDocs(qMsgs);
    const batchMsgs = writeBatch(db);
    msgsSnap.forEach(docSnap => {
      const msgData = docSnap.data();
      if (msgData.metadata && msgData.metadata.type === 'reservation' && msgData.metadata.reservationId === reservationId) {
        batchMsgs.update(docSnap.ref, {
          metadata: { ...msgData.metadata, status: 'permitted', permittedBy }
        });
      }
    });
    await batchMsgs.commit();

    return true;
  } catch (error) {
    console.error("Error permitting reservation:", error);
    throw error;
  }
}

export const fetchReservations = async () => {
  try {
    const querySnapshot = await getDocs(getCol("reservations"));
    const reservations: any[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ ...doc.data(), id: doc.id });
    });
    return reservations;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }
}

export const fetchReservationsByMember = async (memberId: string) => {
  try {
    const q = query(getCol("reservations"), where('memberId', '==', memberId));
    const querySnapshot = await getDocs(q);
    const reservations: any[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ ...doc.data(), id: doc.id });
    });
    return reservations;
  } catch (error) {
    console.error("Error fetching reservations for member:", error);
    return [];
  }
}

export const deleteReservation = async (id: string) => {
  try {
    await deleteDoc(getDocRef("reservations", id));
  } catch (error) {
    console.error("Error deleting reservation:", error);
    throw error;
  }
}

export const updateReservation = async (id: string, updates: any) => {
  try {
    await updateDoc(getDocRef("reservations", id), updates);
  } catch (error) {
    console.error("Error updating reservation:", error);
    throw error;
  }
}

export const addActivity = async (activity: any) => {
  const docRef = await addDoc(getCol("activities"), activity);
  return { ...activity, id: docRef.id };
};

export const fetchStaff = async () => {
  const q = getDocs(getCol("staff"));
  const querySnapshot = await q;
  const staff: any[] = [];
  querySnapshot.forEach((doc) => {
    staff.push({ id: doc.id, ...doc.data() });
  });
  return staff;
};

export const addStaff = async (staffMember: any) => {
  const docRef = await addDoc(getCol("staff"), staffMember);
  return { ...staffMember, id: docRef.id };
};

export const updateStaff = async (id: string, updates: any) => {
  const docRef = getDocRef("staff", id);
  await updateDoc(docRef, updates);
};

export const deleteStaff = async (id: string) => {
  const docRef = getDocRef("staff", id);
  await deleteDoc(docRef);
};

export const fetchLibrarians = async () => {
  const querySnapshot = await getDocs(getCol("librarians"));
  const librarians: any[] = [];
  querySnapshot.forEach((doc) => {
    librarians.push({ ...doc.data(), id: doc.id });
  });
  return librarians;
};

export const addLibrarian = async (librarian: any) => {
  const docRef = await addDoc(getCol("librarians"), librarian);
  return { ...librarian, id: docRef.id };
};

export const updateLibrarian = async (id: string, updates: any) => {
  await updateDoc(getDocRef("librarians", id), updates);
  return updates;
};

export const deleteLibrarian = async (id: string) => {
  await deleteDoc(getDocRef("librarians", id));
};

export const updateActivity = async (id: string, updates: any) => {
  await updateDoc(getDocRef("activities", id), updates);
};

export const permitRenew = async (bookTitle: string, memberId: string, messageId: string, permittedBy: string) => {
  try {
    // 1. Find the pending Renew Request
    const q = query(getCol("activities"), where("memberId", "==", memberId), where("bookTitle", "==", bookTitle), where("action", "==", "Renew Request"), where("status", "==", "Pending"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(getDocRef("activities", snap.docs[0].id), { status: 'Completed' });
    }

    // 2. Add Renew activity
    const memberSnap = await getDoc(getDocRef("members", memberId));
    const memberName = memberSnap.exists() ? memberSnap.data().name : 'Unknown';
    
    await addDoc(getCol("activities"), {
      id: `ACT-${Date.now()}`,
      memberId,
      memberName,
      bookTitle,
      action: 'Renew',
      date: new Date().toISOString(),
      status: 'Completed',
      permittedBy
    });

    // 3. Update the message metadata to show it was permitted for all related messages
    const qMsgs = query(getCol("messages"), where("memberId", "==", memberId));
    const msgsSnap = await getDocs(qMsgs);
    const batchMsgs = writeBatch(db);
    msgsSnap.forEach(docSnap => {
      const msgData = docSnap.data();
      if (msgData.metadata && msgData.metadata.type === 'renew' && msgData.metadata.bookTitle === bookTitle) {
        batchMsgs.update(docSnap.ref, {
          metadata: { ...msgData.metadata, status: 'permitted', permittedBy }
        });
      }
    });
    await batchMsgs.commit();
    return true;
  } catch (error) {
    console.error("Error permitting renew:", error);
    throw error;
  }
}

export const markConversationNotificationsRead = async (userId: string, memberName?: string) => {
  try {
    const q = query(getCol("notifications"), where('userId', '==', userId), where('unread', '==', true));
    const snap = await getDocs(q);
    
    // Check if there are unread notifications
    if (snap.empty) return;
    
    const batch = writeBatch(db);
    let count = 0;
    
    snap.forEach(doc => {
      const data = doc.data();
      let match = false;
      if (memberName && data.message && data.message.includes(memberName)) {
        match = true;
      }
      if (!memberName && (data.type === 'message' || data.type === 'reservation' || data.type === 'renew')) {
        match = true;
      }
      if (match) {
        batch.update(doc.ref, { unread: false });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
};

export const deleteActivity = async (id: string) => {
  await deleteDoc(getDocRef("activities", id));
};

export const addNotification = async (notification: {
  userId: string;
  title: string;
  message: string;
  type: 'checkout' | 'checkin' | 'renew' | 'fine' | 'overdue' | 'reservation' | 'message';
  timestamp?: number;
  unread?: boolean;
}) => {
  try {
    const docRef = await addDoc(getCol("notifications"), {
      ...notification,
      timestamp: notification.timestamp || Date.now(),
      unread: notification.unread !== undefined ? notification.unread : true,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding notification in db helper:", error);
    return null;
  }
};

export const fetchFines = async () => {
  const querySnapshot = await getDocs(getCol("fines"));
  const fines: any[] = [];
  querySnapshot.forEach((doc) => {
    fines.push({ ...doc.data(), id: doc.id });
  });
  return fines;
};

export const addFine = async (fine: any) => {
  const docRef = await addDoc(getCol("fines"), fine);
  return { id: docRef.id, ...fine };
};

export const updateFine = async (id: string, updates: any) => {
  const fineRef = getDocRef("fines", id);
  await updateDoc(fineRef, updates);
};

export const deleteFine = async (id: string) => {
  await deleteDoc(getDocRef("fines", id));
};

