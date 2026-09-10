const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

content = content.replace(
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
        }`,
  `      } else if (activeRole === 'Admin') {
        // For Library Admin
        const isEmail = usernameOrEmail.includes('@');
        const libsRef = collection(db, 'libraries');
        
        let q;
        if (isEmail) {
           q = query(libsRef, where('adminEmail', '==', usernameOrEmail));
        } else {
           q = query(libsRef, where('adminUsername', '==', usernameOrEmail));
        }
        
        const snap = await getDocs(q);
        
        let valid = false;
        if (!snap.empty) {
           const libData = snap.docs[0].data();
           if (libData.adminPassword === password) {
              loginEmail = libData.adminEmail; // Use the actual email for auth
              valid = true;
           }
        }
        
        // Fallback for default admin
        if (!valid && (usernameOrEmail === 'admindiialibrary@2014.com' || usernameOrEmail === 'admin' || usernameOrEmail === 'admin@example.com') && password === 'password123') {
           loginEmail = isEmail ? usernameOrEmail : 'admin@example.com';
           valid = true;
        }`
);

fs.writeFileSync('src/pages/login.tsx', content);
