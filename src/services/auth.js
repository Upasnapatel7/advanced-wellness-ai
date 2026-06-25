import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxczPewXFgMwQ3W9XjXlW9U_26KKeBFPA",
  authDomain: "advanced-wellness-ai.firebaseapp.com",
  projectId: "advanced-wellness-ai",
  storageBucket: "advanced-wellness-ai.firebasestorage.app",
  messagingSenderId: "324932705987",
  appId: "1:324932705987:web:b32e227b5f1e8594be4c76",
  measurementId: "G-3WHV1XB22L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// User registration
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email: email,
      createdAt: new Date(),
      streak: 0,
      totalPoints: 0,
      preferredLanguage: 'en'
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  await signOut(auth);
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Auth state listener - FIXED: Make sure this is properly exported
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};