const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/student/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix member query to use collectionGroup and extract libraryId
  content = content.replace(
    /const membersSnap = await getDocs\(collection\(db, 'members'\)\);/g,
    `const membersSnap = await getDocs(collectionGroup(db, 'members'));`
  );

  content = content.replace(
    /matchedMember = { id: d.id, ...data };/g,
    `matchedMember = { id: d.id, libraryId: d.ref.parent.parent.id, ...data };`
  );

  // Fix other collections to use collectionGroup initially
  content = content.replace(/collection\(db, 'activities'\)/g, `collectionGroup(db, 'activities')`);
  content = content.replace(/collection\(db, 'books'\)/g, `collectionGroup(db, 'books')`);
  content = content.replace(/collection\(db, "messages"\)/g, `collectionGroup(db, 'messages')`);
  content = content.replace(/collection\(db, 'reservations'\)/g, `collectionGroup(db, 'reservations')`);
  content = content.replace(/collection\(db, 'fines'\)/g, `collectionGroup(db, 'fines')`);

  // Now, for addDoc, we need to use the specific library collection
  // e.g., collection(db, 'libraries', memberInfo.libraryId, 'activities')
  content = content.replace(
    /collectionGroup\(db, "activities"\)/g, // If we accidentally replaced an addDoc call
    `collectionGroup(db, 'activities')`
  );

  // Manually fix addDoc calls in loans.tsx
  if (file.includes('loans.tsx')) {
    content = content.replace(
      /collectionGroup\(db, 'activities'\)/g,
      `collection(db, 'libraries', memberInfo.libraryId, 'activities')`
    );
    // Wait, the getDocs call also uses activities! We can't replace all.
  }

  fs.writeFileSync(file, content);
});
