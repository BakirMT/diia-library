import { readFileSync } from 'fs';
const content = readFileSync('src/pages/login.tsx', 'utf8');
console.log(content.includes('querySnapshot.forEach'));
