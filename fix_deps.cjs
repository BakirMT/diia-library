const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/pages');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('import { useAuth } from')) {
    if (!content.includes('libraryId } = useAuth()') && content.includes('} = useAuth()')) {
       content = content.replace(/const \{([^}]+)\} = useAuth\(\)/, (match, p1) => {
          if (!p1.includes('libraryId')) {
             return `const { ${p1}, libraryId } = useAuth()`;
          }
          return match;
       });
       changed = true;
    }
  } else if (content.includes('useAuth()') && !content.includes('import { useAuth }')) {
    // some files might not have it imported? they probably do.
  }
  
  // Replace }, []) with }, [libraryId]) if the effect has fetch calls
  if (content.includes('}, [])') && content.includes('libraryId')) {
    content = content.replace(/\}, \[\]\)/g, '}, [libraryId])');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
  }
}
