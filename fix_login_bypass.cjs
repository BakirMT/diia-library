const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// 1. Remove the useEffect auto-fill
content = content.replace(
  `    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('admin');
      setPassword('password123');
    }`,
  `    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('');
      setPassword('');
    }`
);

// 2. Remove the Admin fallback
content = content.replace(
  `        // Fallback for default admin
        if (!valid && (usernameOrEmail === 'admindiialibrary@2014.com' || usernameOrEmail === 'admin' || usernameOrEmail === 'admin@example.com') && password === 'password123') {
           loginEmail = isEmail ? usernameOrEmail : 'admin@example.com';
           valid = true;
        }`,
  ``
);

// 3. Remove Librarian default login
content = content.replace(
  `        if (!usernameOrEmail.includes('@')) {
          if (usernameOrEmail === 'librarian') loginEmail = 'librarian@example.com';
          else {`,
  `        if (!usernameOrEmail.includes('@')) {
          if (false) {}
          else {`
);


fs.writeFileSync('src/pages/login.tsx', content);
