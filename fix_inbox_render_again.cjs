const fs = require('fs');
let content = fs.readFileSync('src/pages/inbox.tsx', 'utf8');

content = content.replace(
  /const amISender = activeConversation\.role === 'Admin' \? !amISender : msg\.isSender;/,
  `const amISender = activeConversation.role === 'Admin' ? !msg.isSender : msg.isSender;`
);

content = content.replace(
  /className=\{`px-4 py-2\.5 rounded-2xl text-sm \$\{\s*msg\.isSender/,
  `className={\`px-4 py-2.5 rounded-2xl text-sm \${
                          amISender`
);

fs.writeFileSync('src/pages/inbox.tsx', content);
