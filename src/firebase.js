import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfezZTVz2YSAWX7uRWu9rxM_UyAY4_EWw",
  authDomain: "shiire-kanri.firebaseapp.com",
  projectId: "shiire-kanri",
  storageBucket: "shiire-kanri.firebasestorage.app",
  messagingSenderId: "476802849840",
  appId: "1:476802849840:web:9a131ce878567d6fb7a1f5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);