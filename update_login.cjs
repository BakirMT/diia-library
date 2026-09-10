const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// 1. Remove from type Role
content = content.replace(
  "type Role = 'Member' | 'Librarian' | 'Admin' | 'Parent' | 'MainAuthority'",
  "type Role = 'Member' | 'Librarian' | 'Admin' | 'Parent'"
);

// 2. Remove from activeRole useEffect
const effectTarget = `    } else if (activeRole === 'MainAuthority') {
      setUsernameOrEmail('admindiia2014');
      setPassword('Admin@diia2014');
    }`;
content = content.replace(effectTarget, "");

// 3. Remove login logic
const loginLogic = `      } else if (activeRole === 'MainAuthority') {
        if (
          (usernameOrEmail !== 'admindiia2014' && usernameOrEmail !== 'admindiialibrary@2014' && usernameOrEmail !== 'admindiialibrary@2014.com') ||
          password !== 'Admin@diia2014'
        ) {
          throw new Error("Invalid main authority credentials.");
        }
        loginEmail = 'admindiia2014@super.local';
        memberName = 'Super Admin';`;
content = content.replace(loginLogic, "");

// 4. Remove from roles array
const rolesTarget = `    { id: 'Admin', icon: Shield, label: 'Library Admin', desc: 'Manage Branch' },
    { id: 'MainAuthority', icon: Shield, label: 'Main Admin', desc: 'Super Authority' }`;
content = content.replace(rolesTarget, `    { id: 'Admin', icon: Shield, label: 'Library Admin', desc: 'Manage Branch' }`);

fs.writeFileSync('src/pages/login.tsx', content);
