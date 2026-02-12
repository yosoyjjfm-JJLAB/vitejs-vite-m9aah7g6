import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Configuración de Firebase (Producción)
const firebaseConfig = {
    apiKey: "AIzaSyC4MvGXKmHnBjG8Q_3Hj55GjjpEUZ45hP4",
    authDomain: "seguimientoproyectos-a9644.firebaseapp.com",
    projectId: "seguimientoproyectos-a9644",
    storageBucket: "seguimientoproyectos-a9644.firebasestorage.app",
    messagingSenderId: "904852309784",
    appId: "1:904852309784:web:6e55d39d1250d89e34406d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "jjlab-db");
export const storage = getStorage(app);
export const auth = getAuth(app);
