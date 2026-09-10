const fs = require('fs');
let content = fs.readFileSync('src/components/layout/topbar.tsx', 'utf8');

if (content.includes('}, []);') && content.includes('fetchBooks()')) {
  // we need to make sure we have libraryId
  if (!content.includes('libraryId } = useAuth()') && content.includes('} = useAuth()')) {
     content = content.replace(/const \{([^}]+)\} = useAuth\(\)/, (match, p1) => {
        if (!p1.includes('libraryId')) {
           return `const { ${p1}, libraryId } = useAuth()`;
        }
        return match;
     });
  }
  
  content = content.replace(
    /fetchMembers\(\)\.then\(setAllMembers\);\s*\}, \[\]\);/m,
    `fetchMembers().then(setAllMembers);\n  }, [libraryId]);`
  );
  
  fs.writeFileSync('src/components/layout/topbar.tsx', content);
}
