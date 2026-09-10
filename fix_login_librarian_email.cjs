const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

const oldLogic = `        loginEmail = \`\${matchedDoc.username}@librarian.local\`;
        memberName = matchedDoc.name || 'Librarian';
        if (matchedDoc.ref && matchedDoc.ref.parent && matchedDoc.ref.parent.parent) {
          matchedLibraryId = matchedDoc.ref.parent.parent.id;
        }`;

const newLogic = `        memberName = matchedDoc.name || 'Librarian';
        if (matchedDoc.ref && matchedDoc.ref.parent && matchedDoc.ref.parent.parent) {
          matchedLibraryId = matchedDoc.ref.parent.parent.id;
        }
        loginEmail = \`\${matchedLibraryId}-\${matchedDoc.username}@librarian.local\`;`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/login.tsx', content);
