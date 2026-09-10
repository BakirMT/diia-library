const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard.tsx', 'utf8');

// Find the line setting totalBooks and replace it to set both totalCopies and totalTitles
content = content.replace(
  'const booksWithCheckoutCount = books.map((b: any) => {',
  `stats.totalTitles = books.length;
        const booksWithCheckoutCount = books.map((b: any) => {`
);

// We also need to add totalTitles to the initial stats state
content = content.replace(
  `totalBooks: 0,
    overdueCheckIns: 0,`,
  `totalBooks: 0,
    totalTitles: 0,
    overdueCheckIns: 0,`
);

// We need to update the card in the dashboard to show both
content = content.replace(
  `<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Books</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.totalBooks.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Across {stats.categoriesCount} categories
              </p>`,
  `<p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Books (Copies)</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{stats.totalBooks.toLocaleString()}</h3>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                {stats.totalTitles || 0} unique titles
              </p>`
);

fs.writeFileSync('src/pages/dashboard.tsx', content);
