const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin.tsx', 'utf8');

// Add adminUsername to formData
content = content.replace(
  `name: '', email: '', password: '', endDate: '', buyerName: '', phone: '', address: ''`,
  `name: '', username: '', email: '', password: '', endDate: '', buyerName: '', phone: '', address: ''`
);
content = content.replace(
  `name: '', email: '', password: '', endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], buyerName: '', phone: '', address: ''`,
  `name: '', username: '', email: '', password: '', endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], buyerName: '', phone: '', address: ''`
);
content = content.replace(
  `name: lib.name || '',
      email: lib.adminEmail || '',
      password: lib.adminPassword || '',`,
  `name: lib.name || '',
      username: lib.adminUsername || '',
      email: lib.adminEmail || '',
      password: lib.adminPassword || '',`
);

content = content.replace(
  `const { name, email, password, endDate, buyerName, phone, address } = formData`,
  `const { name, username, email, password, endDate, buyerName, phone, address } = formData`
);

content = content.replace(
  `adminEmail: email,
        adminPassword: password,
        subscriptionEndDate: parsedEndDate.toISOString(),`,
  `adminUsername: username,
        adminEmail: email,
        adminPassword: password,
        subscriptionEndDate: parsedEndDate.toISOString(),`
);

// Update display card
content = content.replace(
  `                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Mail className="w-4 h-4" /> <span className="text-sm font-medium">Username</span></div>
                        <span className="text-sm font-bold text-slate-900">{lib.adminEmail}</span>
                      </div>`,
  `                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><User className="w-4 h-4" /> <span className="text-sm font-medium">Username</span></div>
                        <span className="text-sm font-bold text-slate-900">{lib.adminUsername || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Mail className="w-4 h-4" /> <span className="text-sm font-medium">Email</span></div>
                        <span className="text-sm font-bold text-slate-900">{lib.adminEmail}</span>
                      </div>`
);

// Update Modal Inputs
content = content.replace(
  `                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Username / Email <span className="text-red-500">*</span></label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@library.com" />
                </div>`,
  `                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Username <span className="text-red-500">*</span></label>
                  <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="e.g. jdoe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Email <span className="text-red-500">*</span></label>
                  <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@library.com" />
                </div>`
);

fs.writeFileSync('src/pages/superadmin.tsx', content);
