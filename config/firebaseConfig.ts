import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCovJo64N3DmCZ0Yd5Mp9-DL8DDjpPuMl0",
  authDomain: "social-media-app-a5cfa.firebaseapp.com",
  projectId: "social-media-app-a5cfa",
  storageBucket: "social-media-app-a5cfa.firebasestorage.app",
  messagingSenderId: "218839524532",
  appId: "1:218839524532:web:c5b696537b900d4fc6a3e1",
  measurementId: "G-4XFHVKBJK4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export { app, auth };
