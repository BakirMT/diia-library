const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// 1. Add matchedLibraryId
content = content.replace(
  `      let memberCustomPassword = null;`,
  `      let memberCustomPassword = null;\n      let matchedLibraryId = null;`
);

// 2. Set matchedLibraryId for Member
content = content.replace(
  `        const memberDoc = matchedDoc;`,
  `        const memberDoc = matchedDoc;\n        matchedLibraryId = memberDoc.libraryId || null;`
);

// 3. Set matchedLibraryId for Admin
content = content.replace(
  `           if (libData.adminPassword === password) {
              loginEmail = libData.adminEmail; // Use the actual email for auth
              valid = true;
           }`,
  `           if (libData.adminPassword === password) {
              loginEmail = libData.adminEmail; // Use the actual email for auth
              matchedLibraryId = snap.docs[0].id;
              valid = true;
           }`
);

// 4. Use matchedLibraryId in setDoc
content = content.replace(
  `        await setDoc(userRef, {
          name: memberName || user.displayName || 'Member',
          username: username,
          email: user.email || loginEmail,
          role: activeRole,
          createdAt: new Date().toISOString()
        });`,
  `        const userData: any = {
          name: memberName || user.displayName || 'Member',
          username: username,
          email: user.email || loginEmail,
          role: activeRole,
          createdAt: new Date().toISOString()
        };
        if (matchedLibraryId) userData.libraryId = matchedLibraryId;
        await setDoc(userRef, userData);`
);

content = content.replace(
  `        await setDoc(userRef, {
          name: memberName || user.displayName || 'Member',
          username: username,
          role: activeRole
        }, { merge: true });`,
  `        const updateData: any = {
          name: memberName || user.displayName || 'Member',
          username: username,
          role: activeRole
        };
        if (matchedLibraryId) updateData.libraryId = matchedLibraryId;
        await setDoc(userRef, updateData, { merge: true });`
);

fs.writeFileSync('src/pages/login.tsx', content);
