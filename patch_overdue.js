const fs = require('fs');
let code = fs.readFileSync('src/pages/overdue.tsx', 'utf8');

code = code.replace(
  /import \{ (.*?) \} from "lucide-react"/,
  `import { $1, Edit2, Trash2, X } from "lucide-react"`
);

code = code.replace(
  /import \{ fetchActivities, fetchMembers \} from "@\/src\/lib\/db"/,
  `import { fetchActivities, fetchMembers, updateActivity, deleteActivity } from "@/src/lib/db"`
);

fs.writeFileSync('src/pages/overdue.tsx', code);
