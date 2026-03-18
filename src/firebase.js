// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDuYdkgxeOwo0DPh_bLP4sYh9iwmHMJAUI",
  authDomain: "camforapp.firebaseapp.com",
  projectId: "camforapp",
  storageBucket: "camforapp.firebasestorage.app",
  messagingSenderId: "632400352863",
  appId: "1:632400352863:web:20cef909b487f59f542dea"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
export const db = getFirestore(app);

// Inicializa o Storage
export const storage = getStorage(app);

export default app;
