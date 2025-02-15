import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Admin email
export const ADMIN_EMAIL = 'gennaro.mazzacane@gmail.com';
export const ADMIN_PASSWORD = '_1500Napoli500_';

// User roles
export type UserRole = 'admin' | 'user';

// User status
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface UserData {
  email: string;
  role: UserRole;
  status: UserStatus;
  displayName?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  subscription?: {
    plan?: string;
    status?: string;
    endDate?: Date;
  };
}

// Check if user is admin
export const isAdmin = (email: string) => {
  return email === ADMIN_EMAIL;
};

// Login admin user
export const loginAdmin = async (email: string, password: string) => {
  try {
    if (email !== ADMIN_EMAIL) {
      throw new Error('Accesso non autorizzato');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Login regular user
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login
    if (userCredential.user) {
      const userRef = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Register new user
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Create user document
    const userData: UserData = {
      email: user.email!,
      role: isAdmin(email) ? 'admin' : 'user',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    // Send verification email
    await sendEmailVerification(user);

    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Get user data
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const data = userDoc.data() as UserData;
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate(),
      subscription: data.subscription ? {
        ...data.subscription,
        endDate: data.subscription.endDate?.toDate()
      } : undefined
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Update user data
export const updateUserData = async (
  userId: string, 
  updates: Partial<UserData>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Update auth profile if needed
    if (auth.currentUser && (updates.displayName || updates.phoneNumber)) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        phoneNumber: updates.phoneNumber
      });
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Error handling helper
export const getAuthErrorMessage = (error: any): string => {
  if (!error.code) return 'Errore durante l\'autenticazione';
  
  const errorMessages: Record<string, string> = {
    'auth/invalid-credential': 'Email o password non corretti',
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password non corretta',
    'auth/email-already-in-use': 'Email già in uso',
    'auth/weak-password': 'Password troppo debole',
    'auth/invalid-email': 'Email non valida',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
    'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
    'auth/requires-recent-login': 'Per favore, effettua nuovamente il login per completare questa operazione'
  };

  return errorMessages[error.code] || 'Errore durante l\'autenticazione';
};