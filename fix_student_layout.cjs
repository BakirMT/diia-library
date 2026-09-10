const fs = require('fs');
let content = fs.readFileSync('src/components/layout/student-layout.tsx', 'utf8');

if (!content.includes('useAuth')) {
  content = content.replace(
    /import \{ Outlet \} from "react-router-dom"/,
    `import { Outlet } from "react-router-dom"\nimport { useAuth } from "@/src/lib/AuthContext"`
  );
}

content = content.replace(
  /const \[sidebarOpen, setSidebarOpen\] = useState\(false\);/,
  `const [sidebarOpen, setSidebarOpen] = useState(false);\n  const { libraryId } = useAuth();`
);

content = content.replace(
  /<Outlet \/>/,
  `<Outlet key={libraryId || 'default'} />`
);

fs.writeFileSync('src/components/layout/student-layout.tsx', content);
