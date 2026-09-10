const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add wildcard route
content = content.replace(
  `          </Route>\n        </Routes>`,
  `          </Route>\n          <Route path="*" element={<Navigate to="/" replace />} />\n        </Routes>`
);

fs.writeFileSync('src/App.tsx', content);
