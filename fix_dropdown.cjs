const fs = require('fs');
let content = fs.readFileSync('src/pages/members.tsx', 'utf8');

// Replace the hardcoded options with dynamic ones + All Types
const oldDropdown = `<select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex h-10 w-full sm:w-48 rounded-full bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200"
          >
            <option value="All">All Types</option>
            <option value="Member">Member</option>
            <option value="Staff">Staff</option>
          </select>`;

const newDropdown = `<select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex h-10 w-full sm:w-48 rounded-full bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200"
          >
            <option value="All">All Types</option>
            {Array.from(new Set(members.map(m => m.membershipType || m.type || 'Member'))).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>`;

content = content.replace(oldDropdown, newDropdown);
fs.writeFileSync('src/pages/members.tsx', content);
