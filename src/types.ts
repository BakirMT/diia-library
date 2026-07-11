export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  publisher: string;
  publishYear: number;
  language: string;
  pages: number;
  coverUrl?: string;
  shelfLocation: string;
  copiesTotal: number;
  copiesAvailable: number;
  status: 'Available' | 'Reserved' | 'Out of Stock';
  rating?: number;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: 'Member' | 'Staff';
  studentClass: string;
  booksBorrowed: number;
  status: 'Active' | 'Inactive' | 'Suspended';
  avatarUrl?: string;
};

export type Activity = {
  id: string;
  memberId: string;
  memberName: string;
  action: 'Check Out' | 'Check In' | 'Reserved' | 'Renewed';
  bookTitle: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Overdue';
};

export type Reservation = {
  id: string;
  memberId: string;
  memberName: string;
  bookId: string;
  bookTitle: string;
  requestDate: string;
  status: 'Pending' | 'Ready' | 'Fulfilled' | 'Cancelled';
};
