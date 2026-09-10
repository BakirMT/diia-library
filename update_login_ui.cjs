const fs = require('fs');
let content = fs.readFileSync('src/pages/login.tsx', 'utf8');

// Add showPassword state
content = content.replace(
  `  const [isLoading, setIsLoading] = useState(false);`,
  `  const [isLoading, setIsLoading] = useState(false);\n  const [showPassword, setShowPassword] = useState(false);`
);

// Import Eye, EyeOff
content = content.replace(
  `import { BookOpen, User, GraduationCap, Shield, ChevronRight } from "lucide-react";`,
  `import { BookOpen, User, GraduationCap, Shield, ChevronRight, Eye, EyeOff } from "lucide-react";`
);

// Update password input field to have the toggle
content = content.replace(
  `                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 h-12 rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                    placeholder="Enter your password"
                    required
                  />`,
  `                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>`
);

fs.writeFileSync('src/pages/login.tsx', content);
