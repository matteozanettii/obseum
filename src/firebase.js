import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDr6i17UBN9CL7SZOfam6Zl4swi2KiDnaA",
  authDomain: "allmatter-f7654.firebaseapp.com",
  projectId: "allmatter-f7654",
  storageBucket: "allmatter-f7654.firebasestorage.app",
  messagingSenderId: "234840591354",
  appId: "1:234840591354:web:82b57965b174bb80b9b243",
  measurementId: "G-LRZ5S9Z6HC"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const auth = getAuth();