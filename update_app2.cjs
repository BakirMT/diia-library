const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import ParentSettings from './pages/parent/settings';",
  "import ParentSettings from './pages/parent/settings';\nimport SuperAdmin from './pages/superadmin';\nimport Suspended from './pages/suspended';"
);

content = content.replace(
  `<Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentLayout /></ProtectedRoute>}>`,
  `<Route path="/superadmin" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><SuperAdmin /></ProtectedRoute>} />
          <Route path="/suspended" element={<Suspended />} />
          <Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentLayout /></ProtectedRoute>}>`
);

content = content.replace(
  `    if (!allowedRoles.includes(role)) {
      if (role === 'Member') return <Navigate to="/student" replace />;
      return <Navigate to="/" replace />;
    }`,
  `    if (!allowedRoles.includes(role)) {
      if (role === 'Suspended') return <Navigate to="/suspended" replace />;
      if (role === 'Member') return <Navigate to="/student" replace />;
      if (role === 'SuperAdmin') return <Navigate to="/superadmin" replace />;
      if (role === 'Parent') return <Navigate to="/parent" replace />;
      return <Navigate to="/" replace />;
    }`
);

content = content.replace(
  `  if (user && role) {
    if (role === 'Member') return <Navigate to="/student" replace />;
    if (role === 'Parent') return <Navigate to="/parent" replace />;
    if (role === 'Librarian' || role === 'Admin') return <Navigate to="/" replace />;
  }`,
  `  if (user && role) {
    if (role === 'Suspended') return <Navigate to="/suspended" replace />;
    if (role === 'SuperAdmin') return <Navigate to="/superadmin" replace />;
    if (role === 'Member') return <Navigate to="/student" replace />;
    if (role === 'Parent') return <Navigate to="/parent" replace />;
    if (role === 'Librarian' || role === 'Admin') return <Navigate to="/" replace />;
  }`
);

fs.writeFileSync('src/App.tsx', content);
