import admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();

// Verify Firebase ID Token
export const verifyIdToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid or expired token');
  }
};

// Get user by UID
export const getUserByUid = async (uid: string): Promise<admin.auth.UserRecord> => {
  try {
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw new Error('User not found');
  }
};

// Create custom token
export const createCustomToken = async (uid: string, claims?: object): Promise<string> => {
  try {
    const customToken = await auth.createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create custom token');
  }
};

// Set custom user claims
export const setCustomUserClaims = async (uid: string, claims: object): Promise<void> => {
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new Error('Failed to set custom claims');
  }
};

// Delete user
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// List users
export const listUsers = async (maxResults: number = 1000, pageToken?: string): Promise<admin.auth.ListUsersResult> => {
  try {
    const listUsersResult = await auth.listUsers(maxResults, pageToken);
    return listUsersResult;
  } catch (error) {
    console.error('Error listing users:', error);
    throw new Error('Failed to list users');
  }
};

export default admin;
