import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from the config
const dbId = firebaseConfig.firestoreDatabaseId || undefined;

export const db = dbId 
  ? initializeFirestore(app, { ignoreUndefinedProperties: true }, dbId)
  : initializeFirestore(app, { ignoreUndefinedProperties: true });

export const auth = getAuth(app);

// Validate connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified");
  } catch (error: any) {
    console.warn("Firebase connection test details:", error);
    if (error && error.message && (error.message.includes('offline') || error.code === 'unavailable')) {
      console.error("Firebase connection is offline. Please check your network, Firebase Console settings, or check if the database exists in project " + firebaseConfig.projectId + ".");
    } else {
      // Permission denied is expected on boot without authentication and is normal behavior
      console.log("Firebase initialized (connection test returned: " + (error.message || error.code || error) + ")");
    }
  }
}

testConnection();
