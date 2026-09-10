const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  `import { useSettings } from "@/src/lib/SettingsContext"`,
  `import { useSettings } from "@/src/lib/SettingsContext"\nimport { db } from "@/src/lib/firebase"\nimport { collection, query, where, onSnapshot } from "firebase/firestore"`
);

// 2. Remove usersTimer and add real-time presence
content = content.replace(
  `    const usersTimer = setInterval(() => {
      setActiveUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);`,
  `    // Presence tracking
    let unsubPresence = () => {};
    if (settings?.libraryId) {
      const q = query(collection(db, 'presence'), where('libraryId', '==', settings.libraryId));
      unsubPresence = onSnapshot(q, (snap) => {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        let count = 0;
        snap.forEach(doc => {
          if (doc.data().lastActive > fiveMinsAgo) {
            count++;
          }
        });
        setActiveUsers(count);
      });
    }`
);

// 3. Update cleanup
content = content.replace(
  `      clearInterval(usersTimer);`,
  `      unsubPresence();`
);

// 4. Update the effect dependencies to include settings?.libraryId
content = content.replace(
  `    };
  }, []);`,
  `    };
  }, [settings?.libraryId]);`
);


fs.writeFileSync('src/pages/dashboard.tsx', content);
