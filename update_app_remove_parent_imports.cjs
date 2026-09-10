const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("import { ParentLayout } from './components/layout/parent-layout';\n", "");
content = content.replace("import ParentDashboard from './pages/parent/index';\n", "");
content = content.replace("import ParentChildren from './pages/parent/children';\n", "");
content = content.replace("import ParentSubscription from './pages/parent/subscription';\n", "");
content = content.replace("import ParentSettings from './pages/parent/settings';\n", "");

fs.writeFileSync('src/App.tsx', content);
