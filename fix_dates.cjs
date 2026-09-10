const fs = require('fs');
let code = fs.readFileSync('src/lib/mock-data.ts', 'utf8');

code = code.replace(/date: new Date\(\)\.toISOString\(\),/g, "date: '2023-11-20T10:30:00Z',");

fs.writeFileSync('src/lib/mock-data.ts', code);
