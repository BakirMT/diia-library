const fs = require('fs');
let code = fs.readFileSync('src/components/layout/sidebar.tsx', 'utf8');

code = code.replace(
  /import \{([\s\S]*?)Key\n\} from "lucide-react"/,
  `import {$1Key,\n  AlertTriangle\n} from "lucide-react"`
);

code = code.replace(
  /\{ name: 'Circulation', path: '\/circulation', icon: ArrowLeftRight \},/,
  `{ name: 'Circulation', path: '/circulation', icon: ArrowLeftRight },\n  { name: 'Overdue', path: '/overdue', icon: AlertTriangle },`
);

fs.writeFileSync('src/components/layout/sidebar.tsx', code);
