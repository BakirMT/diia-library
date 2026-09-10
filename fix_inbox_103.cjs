const fs = require('fs');
const lines = fs.readFileSync('src/pages/inbox.tsx', 'utf8').split('\n');
lines[102] = '        }));';
fs.writeFileSync('src/pages/inbox.tsx', lines.join('\n'));
