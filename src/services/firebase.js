import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
   apiKey: "AIzaSyAzNShvGSlemnqv3vG5LxLGopn46Xg22Fo",
  authDomain: "advanced-wellness-ai-1b9c0.firebaseapp.com",
  databaseURL: "https://advanced-wellness-ai-1b9c0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "advanced-wellness-ai-1b9c0",
  storageBucket: "advanced-wellness-ai-1b9c0.firebasestorage.app",
  messagingSenderId: "548028800511",
  appId: "1:548028800511:web:45284eae452842d1c51bca",
  measurementId: "G-2KZ50XNKGT"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
