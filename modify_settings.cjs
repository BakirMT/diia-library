const fs = require('fs');

let content = fs.readFileSync('src/pages/settings.tsx', 'utf-8');

const regex = /<Card>\s*<CardHeader>\s*<CardTitle>Password & Security<\/CardTitle>[\s\S]*?<\/CardContent>\s*<\/Card>/g;

content = content.replace(regex, '');

fs.writeFileSync('src/pages/settings.tsx', content);
