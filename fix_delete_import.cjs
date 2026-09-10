const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin.tsx', 'utf8');

content = content.replace(
  `import { collection, getDocs, setDoc, doc } from "firebase/firestore"`,
  `import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore"`
);

fs.writeFileSync('src/pages/superadmin.tsx', content);
