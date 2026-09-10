const fs = require('fs');
let content = fs.readFileSync('src/pages/member-credentials.tsx', 'utf8');

// Update import
content = content.replace(
  `import { fetchMembers } from "@/src/lib/db"`,
  `import { fetchMembers, updateMember } from "@/src/lib/db"`
);

// Update save logic
const oldSaveLogic = `      const memberRef = doc(db, 'members', selectedMember.id)
      await setDoc(memberRef, {
        username,
        email,
        password,
        status
      }, { merge: true })`;

const newSaveLogic = `      await updateMember(selectedMember.id, {
        username,
        email,
        password,
        status
      })`;

content = content.replace(oldSaveLogic, newSaveLogic);

fs.writeFileSync('src/pages/member-credentials.tsx', content);
