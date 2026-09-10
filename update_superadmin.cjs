const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin.tsx', 'utf8');

// Remove createUserWithEmailAndPassword from handleSaveLibrary
const target = `            if (!editingLib) {
        // Only try to create auth user if it's new
        let userCred
        try {
          userCred = await createUserWithEmailAndPassword(auth, email, "LibraryAdmin123!")
          
          await setDoc(doc(db, 'users', userCred.user.uid), {
            role: 'Admin',
            libraryId: libraryId,
            displayName: buyerName || 'Library Admin',
            email: email,
            username: email.split('@')[0]
          })
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
             // Ignore for preview purposes if email already in use, login will handle fallback
          } else {
             console.error(e)
          }
        }
      }`;
content = content.replace(target, "");

fs.writeFileSync('src/pages/superadmin.tsx', content);
