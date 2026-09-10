const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

content = content.replace(
  `    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('');
      setPassword('');
    }`,
  `    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('');
      setPassword('');
    } else {
      setUsernameOrEmail('');
      setPassword('');
    }`
);

fs.writeFileSync('src/pages/login.tsx', content);
