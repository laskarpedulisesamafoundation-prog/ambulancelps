import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from the config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Validate connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified");
  } catch (error: any) {
    if (error && error.message && error.message.includes('offline')) {
      console.error("Firebase connection is offline. Please check your network and configuration.");
    } else {
      // Permission denied is expected on boot without authentication and is normal behavior
      console.log("Firebase initialized");
    }
  }
}

testConnection();
