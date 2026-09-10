const fs = require('fs');
let content = fs.readFileSync('src/pages/settings.tsx', 'utf8');

// Replace "Add Staff" with "Add Librarian"
content = content.replace(
  />Add Staff<\/Button>/g,
  `>Add Librarian</Button>`
);

// Remove the email message button since email is removed
content = content.replace(
  /<Button variant="ghost" size="icon" className="text-slate-500 h-8 w-8 hover:text-\[var\(--color-primary\)\] hover:bg-teal-50" onClick=\{\(\) => handleMessageStaff\(staff\.email\)\}>[\s\S]*?<\/Button>/g,
  ``
);

// We also don't need handleMessageStaff function anymore
content = content.replace(
  /const handleMessageStaff = \(email: string\) => \{[^}]*\};/g,
  ``
);

fs.writeFileSync('src/pages/settings.tsx', content);
