import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/layout/layout';
import { StudentLayout } from './components/layout/student-layout';
import { SettingsProvider } from './lib/SettingsContext';
import Dashboard from './pages/dashboard';
import Books from './pages/books';
import Members from './pages/members';
import Settings from './pages/settings';
import MemberCredentials from './pages/member-credentials';
import Activity from './pages/activity';
import Inbox from './pages/inbox';
import Circulation from "./pages/circulation";
import Overdue from "./pages/overdue";
import Login from './pages/login';
import Reports from './pages/reports';

import StudentDashboard from './pages/student';
import StudentCatalog from './pages/student/catalog';
import StudentReservations from './pages/student/reservations';
import StudentHistory from './pages/student/history';
import StudentLoans from './pages/student/loans';
import StudentSettings from './pages/student/settings';
import StudentInbox from './pages/student/inbox';
import AdminCatalog from './pages/catalog';
import AdminReservations from './pages/reservations';




const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    if (!role) {
      // If the user document doesn't exist, role is null. 
      // We shouldn't show a spinner forever. Let's redirect to login.
      return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(role)) {
      if (role === 'Member') return <Navigate to="/student" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div></div>;
  }

  if (user && role) {
    if (role === 'Member') return <Navigate to="/student" replace />;
    if (role === 'Librarian' || role === 'Admin') return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {

  return (
        <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/student" element={<ProtectedRoute allowedRoles={['Member']}><StudentLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="catalog" element={<StudentCatalog />} />
            <Route path="reservations" element={<StudentReservations />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="loans" element={<StudentLoans />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="inbox" element={<StudentInbox />} />
          </Route>
          <Route path="/" element={<ProtectedRoute allowedRoles={['Admin', 'Librarian']}><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="members" element={<Members />} />
            <Route path="circulation" element={<Circulation />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="overdue" element={<Overdue />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="activity" element={<Activity />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="credentials" element={<MemberCredentials />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

