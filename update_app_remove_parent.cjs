const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove route
content = content.replace(
  `          <Route path="/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentLayout /></ProtectedRoute>}>
            <Route index element={<ParentDashboard />} />
            <Route path="children" element={<ParentChildren />} />
            <Route path="subscription" element={<ParentSubscription />} />
            <Route path="settings" element={<ParentSettings />} />
          </Route>`,
  ``
);

// Remove Navigation redirects
content = content.replace(
  `      if (role === 'Parent') return <Navigate to="/parent" replace />;`,
  ``
);
content = content.replace(
  `    if (role === 'Parent') return <Navigate to="/parent" replace />;`,
  ``
);

fs.writeFileSync('src/App.tsx', content);
