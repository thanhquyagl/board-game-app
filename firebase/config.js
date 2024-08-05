import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA0oZJglH9x10QFFtrbHMgOhN4QqRrFePQ",
  authDomain: "board-game-app-c557f.firebaseapp.com",
  databaseURL: "https://board-game-app-c557f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "board-game-app-c557f",
  storageBucket: "board-game-app-c557f.appspot.com",
  messagingSenderId: "480776948389",
  appId: "1:480776948389:web:7dac979fef012abcf01b4c",
  measurementId: "G-LE7P3HVQLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


export { database };