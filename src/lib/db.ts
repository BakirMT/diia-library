const safeGetStorage = (key: string) => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const safeSetStorage = (key: string, val: string) => {
  try { localStorage.setItem(key, val); } catch (e) {}
};
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { MOCK_BOOKS, MOCK_MEMBERS } from './mock-data';

export const fetchBooks = async () => {
  const querySnapshot = await getDocs(collection(db, "books"));
  const books: any[] = [];
  querySnapshot.forEach((doc) => {
    books.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('books_seeded');
  if (books.length === 0 && !seeded) {
    console.log("No books found, seeding...");
    for (const book of MOCK_BOOKS) {
      await setDoc(doc(db, "books", book.id), book);
      books.push(book);
    }
    safeSetStorage('books_seeded', 'true');
  }
  return books;
};

export const fetchMembers = async () => {
  const querySnapshot = await getDocs(collection(db, "members"));
  const members: any[] = [];
  querySnapshot.forEach((doc) => {
    members.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('members_seeded');
  if (members.length === 0 && !seeded) {
    console.log("No members found, seeding...");
    for (const member of MOCK_MEMBERS) {
      await setDoc(doc(db, "members", member.id), member);
      members.push(member);
    }
    safeSetStorage('members_seeded', 'true');
  }
  return members;
};

export const addBook = async (book: any) => {
  const docRef = await addDoc(collection(db, "books"), book);
  return { ...book, id: docRef.id };
};

export const addMember = async (member: any) => {
  if (member.id) {
    await setDoc(doc(db, "members", member.id), member);
    return member;
  } else {
    const docRef = await addDoc(collection(db, "members"), member);
    return { ...member, id: docRef.id };
  }
};

export const updateMember = async (id: string, updates: any) => {
  await updateDoc(doc(db, "members", id), updates);
};

export const deleteMember = async (id: string) => {
  await deleteDoc(doc(db, "members", id));
};


export const updateBook = async (id: string, updates: any) => {
  await updateDoc(doc(db, "books", id), updates);
};

export const deleteBook = async (id: string) => {
  await deleteDoc(doc(db, "books", id));
};
export const fetchActivities = async () => {
  const querySnapshot = await getDocs(collection(db, "activities"));
  const activities: any[] = [];
  querySnapshot.forEach((doc) => {
    activities.push({ ...doc.data(), id: doc.id });
  });
  
  const seeded = safeGetStorage('activities_seeded');
  if (activities.length === 0 && !seeded) {
    console.log("No activities found, seeding...");
    const { MOCK_ACTIVITIES } = await import('./mock-data');
    for (const activity of MOCK_ACTIVITIES) {
      await setDoc(doc(db, "activities", activity.id), activity);
      activities.push(activity);
    }
    safeSetStorage('activities_seeded', 'true');
  }
  return activities;
};

export const fetchMessages = async (memberId: string) => {
  const querySnapshot = await getDocs(collection(db, "messages"));
  const messages: any[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.memberId === memberId) {
      messages.push({ id: doc.id, ...data });
    }
  });
  // sort by timestamp
  messages.sort((a, b) => a.timestamp - b.timestamp);
  return messages;
};

export const sendMessage = async (memberId: string, text: string, isSender: boolean) => {
  const newMsg = {
    memberId,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    isSender,
  };
  const docRef = await addDoc(collection(db, "messages"), newMsg);

  try {
    if (!isSender) {
      // Sent by member -> notify admin
      let memberName = 'A member';
      try {
        const memberSnap = await getDoc(doc(db, "members", memberId));
        if (memberSnap.exists()) {
          memberName = memberSnap.data().name || 'A member';
        }
      } catch (e) {
        console.error("Error fetching member for notification", e);
      }
      await addNotification({
        userId: 'admin',
        title: 'New Message',
        message: `New message from ${memberName}: "${text}"`,
        type: 'message'
      });
    } else {
      // Sent by admin -> notify the specific member
      await addNotification({
        userId: memberId,
        title: 'New Message from Admin',
        message: `Admin: "${text}"`,
        type: 'message'
      });
    }
  } catch (err) {
    console.error("Error sending message notification:", err);
  }

  return { id: docRef.id, ...newMsg };
};

export const fetchConversations = async () => {
  const members = await fetchMembers();
  // We can fetch all messages to get the last message for each member, or just return members as conversations.
  const querySnapshot = await getDocs(collection(db, "messages"));
  const messages: any[] = [];
  querySnapshot.forEach((doc) => {
    messages.push({ ...doc.data(), id: doc.id });
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
      const newRef = doc(collection(db, "books"));
      batch.set(newRef, book);
      savedBooks.push({ ...book, id: newRef.id });
    });
    await batch.commit();
  }
  return savedBooks;
};


export const addReservation = async (reservation: any) => {
  try {
    const docRef = await addDoc(collection(db, 'reservations'), reservation);
    return { ...reservation, id: docRef.id };
  } catch (error) {
    console.error("Error adding reservation:", error);
    throw error;
  }
}

export const fetchReservations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'reservations'));
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
    const q = query(collection(db, 'reservations'), where('memberId', '==', memberId));
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
    await deleteDoc(doc(db, 'reservations', id));
  } catch (error) {
    console.error("Error deleting reservation:", error);
    throw error;
  }
}

export const updateReservation = async (id: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'reservations', id), updates);
  } catch (error) {
    console.error("Error updating reservation:", error);
    throw error;
  }
}

export const addActivity = async (activity: any) => {
  const docRef = await addDoc(collection(db, "activities"), activity);
  return { ...activity, id: docRef.id };
};

export const fetchStaff = async () => {
  const q = getDocs(collection(db, "staff"));
  const querySnapshot = await q;
  const staff: any[] = [];
  querySnapshot.forEach((doc) => {
    staff.push({ id: doc.id, ...doc.data() });
  });
  return staff;
};

export const addStaff = async (staffMember: any) => {
  const docRef = await addDoc(collection(db, "staff"), staffMember);
  return { ...staffMember, id: docRef.id };
};

export const updateStaff = async (id: string, updates: any) => {
  const docRef = doc(db, "staff", id);
  await updateDoc(docRef, updates);
};

export const deleteStaff = async (id: string) => {
  const docRef = doc(db, "staff", id);
  await deleteDoc(docRef);
};

export const fetchLibrarians = async () => {
  const querySnapshot = await getDocs(collection(db, "librarians"));
  const librarians: any[] = [];
  querySnapshot.forEach((doc) => {
    librarians.push({ ...doc.data(), id: doc.id });
  });
  return librarians;
};

export const addLibrarian = async (librarian: any) => {
  const docRef = await addDoc(collection(db, "librarians"), librarian);
  return { ...librarian, id: docRef.id };
};

export const updateLibrarian = async (id: string, updates: any) => {
  await updateDoc(doc(db, "librarians", id), updates);
  return updates;
};

export const deleteLibrarian = async (id: string) => {
  await deleteDoc(doc(db, "librarians", id));
};

export const updateActivity = async (id: string, updates: any) => {
  await updateDoc(doc(db, "activities", id), updates);
};

export const deleteActivity = async (id: string) => {
  await deleteDoc(doc(db, "activities", id));
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
    const docRef = await addDoc(collection(db, 'notifications'), {
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
