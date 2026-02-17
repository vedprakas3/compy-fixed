// Client-side Firebase configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid
const hasFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: any;
let googleProvider: any;
let facebookProvider: any;
let twitterProvider: any;

if (hasFirebaseConfig) {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  auth = getAuth(firebaseApp);
  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();
  twitterProvider = new TwitterAuthProvider();

  // Configure providers
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  facebookProvider.setCustomParameters({
    display: 'popup'
  });
} else {
  console.warn('Firebase client SDK not initialized - missing environment variables');
  // Create mock implementations
  firebaseApp = {} as FirebaseApp;
  auth = {};
  googleProvider = {};
  facebookProvider = {};
  twitterProvider = {};
}

// Auth helper functions
export const signInWithGoogle = async () => {
  if (!hasFirebaseConfig) return { user: null, error: 'Firebase not configured' };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithFacebook = async () => {
  if (!hasFirebaseConfig) return { user: null, error: 'Firebase not configured' };
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!hasFirebaseConfig) return { user: null, error: 'Firebase not configured' };
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  if (!hasFirebaseConfig) return { user: null, error: 'Firebase not configured' };
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logoutUser = async () => {
  if (!hasFirebaseConfig) return { error: 'Firebase not configured' };
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  if (!hasFirebaseConfig) return { error: 'Firebase not configured' };
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  if (!hasFirebaseConfig) return Promise.resolve(null);
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getIdToken = async (user: FirebaseUser): Promise<string> => {
  if (!hasFirebaseConfig) return '';
  return await user.getIdToken(true);
};

export { auth, googleProvider, facebookProvider, twitterProvider };
export default firebaseApp;
