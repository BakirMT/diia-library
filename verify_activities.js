import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
import { initializeFirestore } from "firebase/firestore";
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, "activities"));
  const activities = snap.docs.map(d => d.data());
  
  // Sort by date
  const sorted = [...activities].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const bookStates = new Map();
  sorted.forEach(act => {
    if (act.action === 'Check Out') {
      bookStates.set(act.memberId + "::" + act.bookTitle, 'Active');
    } else if (act.action === 'Check In') {
      bookStates.set(act.memberId + "::" + act.bookTitle, 'Returned');
    }
  });
  
  console.log(bookStates);
  process.exit(0);
}
run().catch(console.error);
