const fs = require('fs');
let content = fs.readFileSync('src/pages/settings.tsx', 'utf8');

content = content.replace(
  /const handleSaveStaff = \(staffData: Omit<StaffMember, 'id'>\) => \{\s*if \(editingStaff\) \{\s*setStaffList\(prev => prev.map\(s => s.id === editingStaff.id \? \{ \.\.\.s, \.\.\.staffData \} : s\)\);\s*\} else \{\s*setStaffList\(prev => \[\.\.\.prev, \{ \.\.\.staffData, id: Math.random\(\)\.toString\(36\)\.substr\(2, 9\) \}\]\);\s*\}\s*\};/m,
  `const handleSaveStaff = async (staffData: Omit<StaffMember, 'id'>) => {
    if (editingStaff) {
      await updateLibrarian(editingStaff.id, staffData);
      fetchLibrarians().then(setStaffList);
    } else {
      await addLibrarian(staffData);
      fetchLibrarians().then(setStaffList);
    }
  };`
);

fs.writeFileSync('src/pages/settings.tsx', content);
