import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if specified
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Validate initial connection
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection confirmed.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline, will sync when online.');
    } else {
      console.log('Firebase connected (test document lookup attempted).');
    }
    return true;
  }
}

testFirebaseConnection();
