const fs = require('fs');
let content = fs.readFileSync('src/pages/student.tsx', 'utf8');

// Fix imports
if (!content.includes('collectionGroup')) {
  content = content.replace(
    /import {([^}]*)collection([^}]*)} from "firebase\/firestore"/,
    `import {$1collection, collectionGroup$2} from "firebase/firestore"`
  );
}

// Fix member lookup
content = content.replace(
  /const membersSnap = await getDocs\(collection\(db, 'members'\)\);/g,
  `const membersSnap = await getDocs(collectionGroup(db, 'members'));`
);

content = content.replace(
  /matchedMember = { id: d.id, ...data };/g,
  `matchedMember = { id: d.id, libraryId: d.ref.parent?.parent?.id, ...data };`
);

// Fix activities lookup
content = content.replace(
  /const activitiesSnap = await getDocs\(collection\(db, 'activities'\)\);/g,
  `const q = require('firebase/firestore').query(collectionGroup(db, 'activities'), require('firebase/firestore').where('memberId', '==', matchedMember.id));\n        const activitiesSnap = await getDocs(q);`
);

content = content.replace(
  /\.filter\(a => a\.memberId === \(matchedMember as any\)\.id\)/g,
  ``
);

// Fix books lookup (keep it as collectionGroup)
content = content.replace(
  /const booksSnap = await getDocs\(collection\(db, 'books'\)\);/g,
  `const booksSnap = await getDocs(collectionGroup(db, 'books'));`
);

fs.writeFileSync('src/pages/student.tsx', content);
