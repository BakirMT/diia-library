const fs = require('fs');
let content = fs.readFileSync('src/pages/settings.tsx', 'utf8');

content = content.replace(
  /const \{  user, role , libraryId \} = useAuth\(\);\n/,
  ''
);

content = content.replace(
  /export default function Settings\(\) \{\n/,
  `export default function Settings() {\n  const { user, role, libraryId } = useAuth();\n`
);

fs.writeFileSync('src/pages/settings.tsx', content);
