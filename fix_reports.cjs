const fs = require('fs');

function fix() {
  let code = fs.readFileSync('src/pages/reports.tsx', 'utf8');
  
  // Add state for fines
  code = code.replace(
    'const [activities, setActivities] = React.useState<any[]>([]);',
    'const [activities, setActivities] = React.useState<any[]>([]);\n  const [fines, setFines] = React.useState<any[]>([]);'
  );
  
  // Fetch fines
  code = code.replace(
    'fetchBooks(),\n          fetchActivities()\n        ]);\n        setBooks(booksData);\n        setActivities(activitiesData);',
    'fetchBooks(),\n          fetchActivities(),\n          fetchFines()\n        ]);\n        setBooks(booksData);\n        setActivities(activitiesData);\n        setFines(finesData);'
  );
  
  code = code.replace(
    'const [booksData, activitiesData] = await Promise.all([',
    'const [booksData, activitiesData, finesData] = await Promise.all(['
  );
  
  // Replace getFinesReport
  const oldGetFinesReport = `  const getFinesReport = () => {
    // Generate fines based on overdue books
    return getOverdueBooks().filter(item => item.fineAmount > 0);
  };`;
  
  const newGetFinesReport = `  const getFinesReport = () => {
    return fines.map(f => ({
      memberName: f.memberName || 'Unknown',
      bookTitle: f.reason || 'Fine',
      dueDate: f.date,
      fineAmount: f.amount,
      status: f.status
    }));
  };`;
  
  code = code.replace(oldGetFinesReport, newGetFinesReport);
  
  fs.writeFileSync('src/pages/reports.tsx', code);
}
fix();
