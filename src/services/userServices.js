import { db } from './auth';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';

export const updateUserProgress = async (userId, progressData) => {
  const userRef = doc(db, 'userProgress', userId);
  
  await updateDoc(userRef, {
    totalPoints: increment(progressData.points || 0),
    streak: progressData.streak || 0,
    lastActive: new Date(),
    activities: arrayUnion({
      type: progressData.type,
      points: progressData.points,
      timestamp: new Date(),
      details: progressData.details
    })
  });
};

export const getUserProgress = async (userId) => {
  const docRef = doc(db, 'userProgress', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};