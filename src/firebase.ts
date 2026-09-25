import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth Helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Sync user profile to Firestore
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        displayName: user.displayName || 'STEM Scholar',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }

  return user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// User Lessons Persistence Helpers
export async function saveUserLesson(userId: string, lesson: {
  id: string;
  title: string;
  category: string;
  bloomLevel: string;
  primaryEquation: string;
}): Promise<void> {
  const lessonRef = doc(db, 'users', userId, 'savedLessons', lesson.id);
  await setDoc(lessonRef, {
    userId,
    lessonId: lesson.id,
    title: lesson.title,
    category: lesson.category,
    bloomLevel: lesson.bloomLevel,
    primaryEquation: lesson.primaryEquation,
    savedAt: new Date().toISOString(),
  });
}

export async function getUserSavedLessons(userId: string): Promise<any[]> {
  try {
    const colRef = collection(db, 'users', userId, 'savedLessons');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data());
  } catch (err) {
    console.warn('Error fetching saved lessons:', err);
    return [];
  }
}

// User Verified Proofs Persistence Helpers
export async function saveVerifiedProof(userId: string, proof: {
  proofTitle: string;
  isSound: boolean;
  stepsCount: number;
}): Promise<void> {
  const colRef = collection(db, 'users', userId, 'verifiedProofs');
  await addDoc(colRef, {
    userId,
    proofTitle: proof.proofTitle,
    isSound: proof.isSound,
    stepsCount: proof.stepsCount,
    verifiedAt: new Date().toISOString(),
  });
}

export async function getUserVerifiedProofs(userId: string): Promise<any[]> {
  try {
    const colRef = collection(db, 'users', userId, 'verifiedProofs');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data());
  } catch (err) {
    console.warn('Error fetching verified proofs:', err);
    return [];
  }
}
