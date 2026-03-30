import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Using the config provided in the user's snippet
const firebaseConfig = {
    apiKey: "AIzaSyCF1SLO9vMb4mfdB73UL2ldTFIw_vPijxs",
    authDomain: "hospital-roster-652bf.firebaseapp.com",
    databaseURL: "https://hospital-roster-652bf-default-rtdb.firebaseio.com",
    projectId: "hospital-roster-652bf",
    storageBucket: "hospital-roster-652bf.firebasestorage.app",
    messagingSenderId: "391223358576",
    appId: "1:391223358576:web:7958081fac55389fc970b5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
