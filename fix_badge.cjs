const fs = require('fs');
let content = fs.readFileSync('src/pages/members.tsx', 'utf8');

const oldBadge = `<td className="px-6 py-4">
                    <Badge variant="outline" className={member.membershipType === 'Staff' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                      {member.membershipType}
                    </Badge>
                  </td>`;

const newBadge = `<td className="px-6 py-4">
                    <Badge variant="outline" className={(member.membershipType || member.type || 'Member') === 'Staff' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                      {member.membershipType || member.type || 'Member'}
                    </Badge>
                  </td>`;

content = content.replace(oldBadge, newBadge);
fs.writeFileSync('src/pages/members.tsx', content);
