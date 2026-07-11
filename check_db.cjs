const admin = require('firebase-admin');
// We can't easily query firestore from node without service account.
// But we can create a temporary API endpoint in our express server to fetch it.
