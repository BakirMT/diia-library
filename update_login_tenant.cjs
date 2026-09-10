const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// Update Library Admin login logic
content = content.replace(
  `      } else if (activeRole === 'Admin') {
        // For Library Admin
        if (!usernameOrEmail.includes('@')) {
          if (usernameOrEmail === 'admin') loginEmail = 'admin@example.com';
          else {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', usernameOrEmail), where('role', '==', 'Admin'));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              loginEmail = querySnapshot.docs[0].data().email;
            } else {
              loginEmail = \`\${usernameOrEmail}@example.com\`;
            }
          }
        }
        memberName = 'Admin';
      }`,
  `      } else if (activeRole === 'Admin') {
        // For Library Admin
        const searchEmail = usernameOrEmail.includes('@') ? usernameOrEmail : usernameOrEmail + '@example.com';
        const libsRef = collection(db, 'libraries');
        const q = query(libsRef, where('adminEmail', '==', searchEmail));
        const snap = await getDocs(q);
        
        let valid = false;
        if (!snap.empty) {
           const libData = snap.docs[0].data();
           if (libData.adminPassword === password) {
              loginEmail = searchEmail;
              valid = true;
           }
        }
        
        // Fallback for default admin
        if (!valid && (searchEmail === 'admindiialibrary@2014.com' || searchEmail === 'admin@example.com') && password === 'password123') {
           loginEmail = searchEmail;
           valid = true;
        }

        if (!valid) {
           throw new Error("Invalid library admin credentials.");
        }
        memberName = 'Admin';
      }`
);

// Override Firebase password for Admin role
content = content.replace(
  `        if (activeRole === 'Member') {
           firebasePassword = loginEmail + "_secret";
        } else {
           firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
        }`,
  `        if (activeRole === 'Member') {
           firebasePassword = loginEmail + "_secret";
        } else if (activeRole === 'Admin') {
           firebasePassword = "LibraryAdmin123!"; // Static password for auth bypass
        } else {
           firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
        }`
);

content = content.replace(
  `          if (activeRole === 'Member') {
             firebasePassword = loginEmail + "_secret";
          } else {
             firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
          }`,
  `          if (activeRole === 'Member') {
             firebasePassword = loginEmail + "_secret";
          } else if (activeRole === 'Admin') {
             firebasePassword = "LibraryAdmin123!";
          } else {
             firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
          }`
);

fs.writeFileSync('src/pages/login.tsx', content);
