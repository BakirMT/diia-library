const fs = require('fs');
const path = require('path');

const dir = 'src/pages/student/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix imports
  if (!content.includes('collectionGroup')) {
    content = content.replace(
      /import {([^}]*)collection([^}]*)} from "firebase\/firestore"/,
      `import {$1collection, collectionGroup$2} from "firebase/firestore"`
    );
  }

  // Find all getDocs(collection(db, 'xxx')) and change to collectionGroup
  content = content.replace(
    /getDocs\(collection\(db,\s*['"](members|books|activities|fines|reservations|messages|notifications)['"]\)\)/g,
    `getDocs(collectionGroup(db, '$1'))`
  );

  content = content.replace(
    /query\(collection\(db,\s*['"](members|books|activities|fines|reservations|messages|notifications)['"]\)/g,
    `query(collectionGroup(db, '$1')`
  );

  // Fix memberId libraryId extraction
  content = content.replace(
    /matchedMember = { id: d.id, ...data };/g,
    `matchedMember = { id: d.id, libraryId: d.ref.parent?.parent?.id, ...data };`
  );

  // Fix addDoc calls to use the member's library
  content = content.replace(
    /addDoc\(collection\(db,\s*['"](activities|notifications|reservations|messages)['"]\)/g,
    `addDoc(collection(db, 'libraries', memberInfo?.libraryId || 'default_library', '$1')`
  );

  // Special fix for history.tsx which doesn't use memberInfo but matchedMember
  content = content.replace(
    /addDoc\(collection\(db, 'libraries', memberInfo\?\.libraryId \|\| 'default_library', 'notifications'\)/g,
    `addDoc(collection(db, 'libraries', (typeof memberInfo !== 'undefined' ? memberInfo?.libraryId : (typeof matchedMember !== 'undefined' ? matchedMember?.libraryId : 'default_library')), 'notifications')`
  );

  fs.writeFileSync(file, content);
});
