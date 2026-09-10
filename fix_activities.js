import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
// Need to initialize firestore properly like in the app
import { initializeFirestore } from "firebase/firestore";
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function run() {
  await addDoc(collection(db, "activities"), {
    id: `ACT-${Date.now()}-1`,
    memberId: 'M001',
    memberName: 'Eleanor Shellstrop',
    action: 'Check In',
    bookTitle: 'The Design of Everyday Things',
    date: new Date().toISOString(),
    status: 'Completed'
  });
  
  await addDoc(collection(db, "activities"), {
    id: `ACT-${Date.now()}-2`,
    memberId: 'M004',
    memberName: 'Jason Mendoza',
    action: 'Check In',
    bookTitle: 'Clean Code',
    date: new Date().toISOString(),
    status: 'Completed'
  });
  
  console.log("Added Check In activities");
  process.exit(0);
}
run().catch(console.error);
