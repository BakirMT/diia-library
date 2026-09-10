const fs = require('fs');
let content = fs.readFileSync('src/pages/members.tsx', 'utf8');

const oldFilter = `    const matchesType = selectedType === 'All' || m.membershipType === selectedType;`;
const newFilter = `    const matchesType = selectedType === 'All' || 
      String(m.membershipType || '').toLowerCase() === selectedType.toLowerCase() ||
      String(m.type || '').toLowerCase() === selectedType.toLowerCase();`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/pages/members.tsx', content);
