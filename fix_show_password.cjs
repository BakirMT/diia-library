const fs = require('fs');
let content = fs.readFileSync('src/pages/member-credentials.tsx', 'utf8');

// 1. Add state for showPassword
content = content.replace(
  `  const [isSaving, setIsSaving] = React.useState(false)`,
  `  const [isSaving, setIsSaving] = React.useState(false)\n  const [showPassword, setShowPassword] = React.useState(false)`
);

// 2. Add imports
content = content.replace(
  `import { Search, Key, CheckCircle, Shield } from "lucide-react"`,
  `import { Search, Key, CheckCircle, Shield, Eye, EyeOff } from "lucide-react"`
);

// 3. Update the password input field
const oldPasswordBlock = `                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <Input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set a password"
                    required
                  />
                  <p className="text-xs text-slate-500">This password will only work on the Member login page.</p>
                </div>`;

const newPasswordBlock = `                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Set a password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">This password will only work on the Member login page.</p>
                </div>`;

content = content.replace(oldPasswordBlock, newPasswordBlock);

fs.writeFileSync('src/pages/member-credentials.tsx', content);
