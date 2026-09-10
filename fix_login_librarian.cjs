const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

const oldLibrarianLogic = `      } else {
        // For Librarian
        if (!usernameOrEmail.includes('@')) {
          if (false) {}
          else {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', usernameOrEmail), where('role', '==', activeRole));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              loginEmail = querySnapshot.docs[0].data().email;
            } else {
              loginEmail = \`\${usernameOrEmail}@example.com\`;
            }
          }
        }
      }`;

const newLibrarianLogic = `      } else {
        // For Librarian
        const libRef = collectionGroup(db, 'librarians');
        const querySnapshot = await getDocs(libRef);
        
        const searchValue = usernameOrEmail.toLowerCase().trim();
        let matchedDoc = null;
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (
            (data.username && data.username.toLowerCase().trim() === searchValue) ||
            (data.email && data.email.toLowerCase().trim() === searchValue)
          ) {
            matchedDoc = data;
            matchedDoc.ref = doc.ref;
          }
        });
        
        if (!matchedDoc) {
          throw new Error("Librarian account not found. Please contact the administrator.");
        }
        
        if (matchedDoc.status !== 'Active') {
          throw new Error("Librarian account is currently inactive.");
        }

        if (matchedDoc.password !== password) {
          throw new Error("Invalid password.");
        }
        
        loginEmail = \`\${matchedDoc.username}@librarian.local\`;
        memberName = matchedDoc.name || 'Librarian';
        if (matchedDoc.ref && matchedDoc.ref.parent && matchedDoc.ref.parent.parent) {
          matchedLibraryId = matchedDoc.ref.parent.parent.id;
        }
      }`;

content = content.replace(oldLibrarianLogic, newLibrarianLogic);

fs.writeFileSync('src/pages/login.tsx', content);
