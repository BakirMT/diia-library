const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// For Librarian, we can use a static firebase password since we verified against Firestore
content = content.replace(
  /\} else if \(activeRole === 'Admin'\) \{/g,
  `} else if (activeRole === 'Admin' || activeRole === 'Librarian') {`
);

fs.writeFileSync('src/pages/login.tsx', content);
