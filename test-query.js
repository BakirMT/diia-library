import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
// Need to load the config from the applet
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config.firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "messages"));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.metadata && data.metadata.type === 'reservation') {
      console.log(doc.id, data.metadata);
    }
  });
}
run();
