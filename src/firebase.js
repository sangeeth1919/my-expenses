import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

function env(name) {
  return (process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

const firebaseConfig = {
  apiKey: env("REACT_APP_FIREBASE_API_KEY"),
  authDomain: env("REACT_APP_FIREBASE_AUTH_DOMAIN"),
  projectId: env("REACT_APP_FIREBASE_PROJECT_ID"),
  storageBucket: env("REACT_APP_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("REACT_APP_FIREBASE_APP_ID"),
};

export const USER_ID = "me";

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let db;

if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
