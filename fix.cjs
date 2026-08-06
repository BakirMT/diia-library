const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/student.tsx', 'utf8');
  code = code.replace(
    'className="flex items-center justify-between p-4 rounded-xl border `${fine.status === \'Paid\' ? \'border-green-100 bg-green-50/50\' : \'border-red-100 bg-red-50/50\'}`"',
    'className={`flex items-center justify-between p-4 rounded-xl border ${fine.status === \'Paid\' ? \'border-green-100 bg-green-50/50\' : \'border-red-100 bg-red-50/50\'}`}'
  );
  fs.writeFileSync('src/pages/student.tsx', code);
}
fix();
