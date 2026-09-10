const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
content = content.replace(
  "import { StudentLayout } from './components/layout/student-layout';",
  "import { StudentLayout } from './components/layout/student-layout';\nimport { ParentLayout } from './components/layout/parent-layout';\nimport ParentDashboard from './pages/parent/index';\nimport ParentChildren from './pages/parent/children';\nimport ParentSubscription from './pages/parent/subscription';\nimport ParentSettings from './pages/parent/settings';"
);

// Add Parent route
content = content.replace(
  `<Route path="/student" element={<ProtectedRoute allowedRoles={['Member']}><StudentLayout /></ProtectedRoute>}>`,
  `<Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentLayout /></ProtectedRoute>}>
            <Route index element={<ParentDashboard />} />
            <Route path="children" element={<ParentChildren />} />
            <Route path="subscription" element={<ParentSubscription />} />
            <Route path="settings" element={<ParentSettings />} />
          </Route>
          <Route path="/student" element={<ProtectedRoute allowedRoles={['Member']}><StudentLayout /></ProtectedRoute>}>`
);

// Fix PublicRoute redirection
content = content.replace(
  `if (role === 'Member') return <Navigate to="/student" replace />;
    if (role === 'Librarian' || role === 'Admin') return <Navigate to="/" replace />;`,
  `if (role === 'Member') return <Navigate to="/student" replace />;
    if (role === 'Parent') return <Navigate to="/parent" replace />;
    if (role === 'Librarian' || role === 'Admin') return <Navigate to="/" replace />;`
);

fs.writeFileSync('src/App.tsx', content);
