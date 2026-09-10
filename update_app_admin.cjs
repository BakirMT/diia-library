const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Import AdminLogin
content = content.replace(
  "import Suspended from './pages/suspended';",
  "import Suspended from './pages/suspended';\nimport AdminLogin from './pages/admin-login';"
);

// Add Route
content = content.replace(
  `<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />`,
  `<Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/admin" element={<PublicRoute><AdminLogin /></PublicRoute>} />`
);

fs.writeFileSync('src/App.tsx', content);
