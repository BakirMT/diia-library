const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

content = content.replace(
  "type Role = 'Member' | 'Librarian' | 'Admin' | 'Parent'",
  "type Role = 'Member' | 'Librarian' | 'Admin'"
);

content = content.replace(
  `    } else if (activeRole === 'Parent') {
      setUsernameOrEmail('parent1');
      setPassword('parent123');`,
  ``
);

content = content.replace(
  `    } else if (role === 'Parent') {
      navigate('/parent');`,
  ``
);

content = content.replace(
  `    { id: 'Parent', icon: User, label: 'Parent', desc: 'Monitor Subscriptions' },\n`,
  ``
);

fs.writeFileSync('src/pages/login.tsx', content);
