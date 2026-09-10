const fs = require('fs');
let content = fs.readFileSync('src/pages/inbox.tsx', 'utf8');

const targetBlock = `<div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full hidden sm:inline-flex">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full hidden sm:inline-flex">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, '');
  fs.writeFileSync('src/pages/inbox.tsx', content);
  console.log("Successfully removed icons");
} else {
  console.log("Could not find target block");
}
