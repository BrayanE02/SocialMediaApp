// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
export { app };
