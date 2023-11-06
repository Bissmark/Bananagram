import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js'
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js'

const firebaseConfig = {
    apiKey: "AIzaSyCc-D4BmYSU9S-PTKzshUojIr5THkvpYpI",
    authDomain: "bananagrams-26d56.firebaseapp.com",
    projectId: "bananagrams-26d56",
    storageBucket: "bananagrams-26d56.appspot.com",
    messagingSenderId: "583172000650",
    appId: "1:583172000650:web:42ff03eb30377391471673",
    measurementId: "G-2R9K0X5YNC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, setDoc, getDoc };