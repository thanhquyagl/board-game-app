// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0oZJglH9x10QFFtrbHMgOhN4QqRrFePQ",
  authDomain: "board-game-app-c557f.firebaseapp.com",
  projectId: "board-game-app-c557f",
  storageBucket: "board-game-app-c557f.appspot.com",
  messagingSenderId: "480776948389",
  appId: "1:480776948389:web:7dac979fef012abcf01b4c",
  measurementId: "G-LE7P3HVQLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);