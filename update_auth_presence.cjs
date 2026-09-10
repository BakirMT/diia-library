const fs = require('fs');
let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

// 1. Add setDoc to import
content = content.replace(
  `import { doc, getDoc, onSnapshot } from 'firebase/firestore';`,
  `import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';`
);

// 2. Add presence useEffect
const presenceEffect = `
  useEffect(() => {
    if (!user || !libraryId) return;
    const updatePresence = async () => {
      try {
        await setDoc(doc(db, 'presence', user.uid), {
          libraryId,
          lastActive: new Date().toISOString(),
          role
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to update presence", e);
      }
    };
    updatePresence();
    const interval = setInterval(updatePresence, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [user, libraryId, role]);
`;

content = content.replace(
  `  const logout = async () => {`,
  `${presenceEffect}\n  const logout = async () => {`
);

fs.writeFileSync('src/lib/AuthContext.tsx', content);
