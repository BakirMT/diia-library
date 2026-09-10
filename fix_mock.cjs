const fs = require('fs');
let code = fs.readFileSync('src/lib/mock-data.ts', 'utf8');

// Remove the push statements
code = code.replace(/\/\/ Appending check-in activities[\s\S]*?\n\n/g, '');
code = code.replace(/MOCK_ACTIVITIES\.push\([\s\S]*?as any\);\n/g, '');

// Actually insert them into the array
const activitiesEnd = code.indexOf('] as const;');
if (activitiesEnd !== -1) {
  const injection = `,
  {
    id: 'A004',
    memberId: 'M001',
    memberName: 'Eleanor Shellstrop',
    action: 'Check In',
    bookTitle: 'The Design of Everyday Things',
    date: new Date().toISOString(),
    status: 'Completed'
  },
  {
    id: 'A005',
    memberId: 'M004',
    memberName: 'Jason Mendoza',
    action: 'Check In',
    bookTitle: 'Clean Code',
    date: new Date().toISOString(),
    status: 'Completed'
  }
`;
  code = code.substring(0, activitiesEnd) + injection + code.substring(activitiesEnd);
}

fs.writeFileSync('src/lib/mock-data.ts', code);
