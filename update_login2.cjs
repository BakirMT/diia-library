const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// Update routing
content = content.replace(
  "type Role = 'Member' | 'Librarian' | 'Admin' | 'Parent'",
  "type Role = 'Member' | 'Librarian' | 'Admin' | 'Parent' | 'MainAuthority'"
);

content = content.replace(
  `    } else if (activeRole === 'Parent') {
      navigate('/parent');
    } else {
      navigate('/');
    }`,
  `    } else if (activeRole === 'Parent') {
      navigate('/parent');
    } else if (activeRole === 'MainAuthority') {
      navigate('/superadmin');
    } else {
      navigate('/');
    }`
);

// Pre-fill Main Authority
content = content.replace(
  `    } else if (activeRole === 'Parent') {
      setUsernameOrEmail('parent1');
      setPassword('parent123');
    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('admindiia2014');
      setPassword('Admin@diia2014');
    }`,
  `    } else if (activeRole === 'Parent') {
      setUsernameOrEmail('parent1');
      setPassword('parent123');
    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('admin');
      setPassword('password123');
    } else if (activeRole === 'MainAuthority') {
      setUsernameOrEmail('admindiia2014');
      setPassword('Admin@diia2014');
    }`
);

// Login Logic
content = content.replace(
  `      } else if (activeRole === 'Admin') {
        if (
          (usernameOrEmail !== 'admindiia2014' && usernameOrEmail !== 'admindiialibrary@2014' && usernameOrEmail !== 'admindiialibrary@2014.com') ||
          password !== 'Admin@diia2014'
        ) {
          throw new Error("Invalid admin credentials.");
        }
        loginEmail = 'admindiialibrary@2014.com';
        memberName = 'Admin';
      } else {
        // For Librarian`,
  `      } else if (activeRole === 'MainAuthority') {
        if (
          (usernameOrEmail !== 'admindiia2014' && usernameOrEmail !== 'admindiialibrary@2014' && usernameOrEmail !== 'admindiialibrary@2014.com') ||
          password !== 'Admin@diia2014'
        ) {
          throw new Error("Invalid main authority credentials.");
        }
        loginEmail = 'admindiia2014@super.local';
        memberName = 'Super Admin';
      } else if (activeRole === 'Admin') {
        // For Library Admin
        if (!usernameOrEmail.includes('@')) {
          if (usernameOrEmail === 'admin') loginEmail = 'admin@example.com';
          else {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', usernameOrEmail), where('role', '==', 'Admin'));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              loginEmail = querySnapshot.docs[0].data().email;
            } else {
              loginEmail = \`\${usernameOrEmail}@example.com\`;
            }
          }
        }
        memberName = 'Admin';
      } else {
        // For Librarian`
);

// Add MainAuthority tab, optionally hiding it or putting it as a small link. The user uploaded a sheet, maybe they want it on the tabs.
content = content.replace(
  `  const roles = [
    { id: 'Member', icon: GraduationCap, label: 'Student', desc: 'Browse & Reserve' },
    { id: 'Parent', icon: User, label: 'Parent', desc: 'Monitor Subscriptions' },
    { id: 'Admin', icon: Shield, label: 'Admin', desc: 'Main Authority' },
  ] as { id: Role; icon: any; label: string; desc: string }[];`,
  `  const roles = [
    { id: 'Member', icon: GraduationCap, label: 'Student', desc: 'Browse & Reserve' },
    { id: 'Parent', icon: User, label: 'Parent', desc: 'Monitor Subscriptions' },
    { id: 'Librarian', icon: User, label: 'Librarian', desc: 'Manage & Assist' },
    { id: 'Admin', icon: Shield, label: 'Library Admin', desc: 'Manage Branch' },
    { id: 'MainAuthority', icon: Shield, label: 'Main Admin', desc: 'Super Authority' }
  ] as { id: Role; icon: any; label: string; desc: string }[];`
);

fs.writeFileSync('src/pages/login.tsx', content);
