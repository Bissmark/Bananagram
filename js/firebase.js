// Import the functions you need from the SDKs you need
// import { initializeApp } from "../firebase/app";
// import { getDatabase, ref, onValue, set } from "../firebase/database";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCc-D4BmYSU9S-PTKzshUojIr5THkvpYpI",
    authDomain: "bananagrams-26d56.firebaseapp.com",
    projectId: "bananagrams-26d56",
    storageBucket: "bananagrams-26d56.appspot.com",
    messagingSenderId: "583172000650",
    appId: "1:583172000650:web:42ff03eb30377391471673",
    measurementId: "G-2R9K0X5YNC",
    databaseURL: "https://bananagrams-26d56-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getDatabase(app);

export { ref, onValue, set, db };