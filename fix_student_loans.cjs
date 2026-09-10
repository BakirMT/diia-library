const fs = require('fs');
let content = fs.readFileSync('src/pages/student/loans.tsx', 'utf8');

content = content.replace(
  `import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore"`,
  `import { collection, getDocs, doc, getDoc, addDoc, collectionGroup, query, where } from "firebase/firestore"`
);

content = content.replace(
  `const membersSnap = await getDocs(collection(db, 'members'));`,
  `const membersSnap = await getDocs(collectionGroup(db, 'members'));`
);

content = content.replace(
  `const activitiesSnap = await getDocs(collection(db, 'activities'));`,
  `const q = query(collectionGroup(db, 'activities'), where('memberId', '==', matchedMember.id));
        const activitiesSnap = await getDocs(q);`
);

content = content.replace(
  `.filter(a => a.memberId === (matchedMember as any).id)`,
  ``
);

fs.writeFileSync('src/pages/student/loans.tsx', content);
