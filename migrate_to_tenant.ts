import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const configRaw = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configRaw);

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

const collectionsToMigrate = ['books', 'members', 'activities', 'messages', 'reservations', 'notifications', 'fines', 'staff', 'librarians'];
const targetLibraryId = 'default_library';

async function migrate() {
  for (const colName of collectionsToMigrate) {
    console.log(`Migrating ${colName}...`);
    const querySnapshot = await getDocs(collection(db, colName));
    let count = 0;
    for (const docSnap of querySnapshot.docs) {
      await setDoc(doc(db, 'libraries', targetLibraryId, colName, docSnap.id), docSnap.data());
      count++;
    }
    console.log(`Migrated ${count} documents for ${colName}`);
  }
  
  // Create library doc
  await setDoc(doc(db, 'libraries', targetLibraryId), {
    name: "Default Library",
    adminEmail: "admindiialibrary@2014.com",
    subscriptionEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(), // 10 years
    status: 'Active'
  });
  
  console.log("Migration complete.");
  process.exit(0);
}

migrate();
