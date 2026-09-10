const fs = require('fs');

let content = fs.readFileSync('src/pages/inbox.tsx', 'utf8');

const oldMap = /\{currentMessages\.map\(\(msg\) => \([\s\S]*?key=\{msg\.id\}/;
const newMap = `{currentMessages.map((msg) => {
                  const amISender = activeConversation.role === 'Admin' ? !msg.isSender : msg.isSender;
                  return (
                  <div 
                    key={msg.id}`;

content = content.replace(oldMap, newMap);

content = content.replace(/msg\.isSender \?/g, 'amISender ?');
content = content.replace(/!msg\.isSender/g, '!amISender');

content = content.replace(/<\/div>\n\s*\}\)\)/, `</div>\n                )})\n              }`); // Fix closing paren for map

fs.writeFileSync('src/pages/inbox.tsx', content);
