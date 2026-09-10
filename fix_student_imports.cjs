const fs = require('fs');
let content = fs.readFileSync('src/pages/student.tsx', 'utf8');

content = content.replace(
  `import { collection, collectionGroup, getDocs, doc, getDoc } from "firebase/firestore"`,
  `import { collection, collectionGroup, getDocs, doc, getDoc, query, where } from "firebase/firestore"`
);

content = content.replace(
  /require\('firebase\/firestore'\)\.query/g,
  `query`
);
content = content.replace(
  /require\('firebase\/firestore'\)\.where/g,
  `where`
);

fs.writeFileSync('src/pages/student.tsx', content);
