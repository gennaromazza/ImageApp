import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCjm6MOIuRFXQkTKwREvVWo8zogfNA6HPg",
  authDomain: "cinema-70fbc.firebaseapp.com",
  projectId: "cinema-70fbc",
  storageBucket: "cinema-70fbc.appspot.com",
  messagingSenderId: "508764987276",
  appId: "1:508764987276:web:878a0e32d806071bf380a9",
  measurementId: "G-E9KFW2B3BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');
const storage = getStorage(app);

// Initialize Firebase state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const waitForFirebase = () => {
  if (isInitialized) {
    return Promise.resolve();
  }

  if (!initializationPromise) {
    initializationPromise = new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        isInitialized = true;
        unsubscribe();
        resolve();
      });
    });
  }

  return initializationPromise;
};

// Export initialized services
export { auth, db, functions, storage };