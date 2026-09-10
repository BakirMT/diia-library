const fs = require('fs');
let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

// The second instance of data.role is inside onSnapshot
content = content.replace(
  `        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role || 'Member');
            setProfile({ displayName: data.displayName || currentUser.displayName, photoURL: data.photoURL || currentUser.photoURL });
          } else {
            setRole(currentUser.email === 'bakirmannarkkad170@gmail.com' ? 'Admin' : 'Librarian');
          }
        }, (error) => {`,
  `        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (currentUser.email === 'admindiia2014@super.local') {
               setRole('SuperAdmin');
            } else {
               const lid = data.libraryId || 'default_library';
               const libSnap = await getDoc(doc(db, 'libraries', lid));
               if (libSnap.exists()) {
                 const libData = libSnap.data();
                 const endDate = new Date(libData.subscriptionEndDate);
                 if (new Date() > endDate) {
                   setRole('Suspended');
                 } else {
                   setRole(data.role || 'Member');
                 }
               } else {
                 setRole(data.role || 'Member');
               }
            }
            setProfile({ displayName: data.displayName || currentUser.displayName, photoURL: data.photoURL || currentUser.photoURL });
          } else {
            setRole(currentUser.email === 'bakirmannarkkad170@gmail.com' ? 'Admin' : 'Librarian');
          }
        }, (error) => {`
);

fs.writeFileSync('src/lib/AuthContext.tsx', content);
