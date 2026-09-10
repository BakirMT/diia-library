const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// 1. Add collectionGroup to imports
content = content.replace(
  `import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";`,
  `import { doc, getDoc, setDoc, collection, query, where, getDocs, collectionGroup } from "firebase/firestore";`
);

// 2. Fix the member query to use collectionGroup
const oldMemberQuery = `      if (activeRole === 'Member') {
        const membersRef = collection(db, 'members');
        const querySnapshot = await getDocs(membersRef);`;

const newMemberQuery = `      if (activeRole === 'Member') {
        const membersRef = collectionGroup(db, 'members');
        const querySnapshot = await getDocs(membersRef);`;

content = content.replace(oldMemberQuery, newMemberQuery);

// 3. Fix the library ID extraction for member Doc
const oldExtractLib = `        if (!matchedDoc) {
          throw new Error("Account not found in members list. Please contact the administrator.");
        }
        
        const memberDoc = matchedDoc;
        matchedLibraryId = memberDoc.libraryId || null;`;

const newExtractLib = `        if (!matchedDoc) {
          throw new Error("Account not found in members list. Please contact the administrator.");
        }
        
        const memberDoc = matchedDoc;
        // The path will be libraries/{libraryId}/members/{memberId}
        if (matchedDocRef) {
          matchedLibraryId = matchedDocRef.parent.parent.id;
        }`;

content = content.replace(oldExtractLib, newExtractLib);

// 4. In the loop, keep track of matchedDocRef
content = content.replace(
  `        let matchedId = null;`,
  `        let matchedId = null;
        let matchedDocRef = null;`
);

content = content.replace(
  `            matchedDoc = data;
            matchedId = doc.id;`,
  `            matchedDoc = data;
            matchedId = doc.id;
            matchedDocRef = doc.ref;`
);


// 5. Remove the default autofill for Member
content = content.replace(
  `    if (activeRole === 'Member') {
      setUsernameOrEmail('bakirmannarkkad170@gmail.com'); // or member@example.com
      setPassword('123');

    } else if (activeRole === 'Admin') {`,
  `    if (activeRole === 'Member') {
      setUsernameOrEmail('');
      setPassword('');

    } else if (activeRole === 'Admin') {`
);

fs.writeFileSync('src/pages/login.tsx', content);
