import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { UserBookingSettings, UserProfile } from '../types/user';

// Create initial user profile
export const createInitialUserProfile = async (userId: string, email: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create default booking settings
    const settingsRef = doc(db, 'user_booking_settings', userId);
    await setDoc(settingsRef, {
      userId,
      enabled: true,
      maxBookingsPerDay: 20,
      bookingIntervals: 30,
      startTime: '09:00',
      endTime: '18:00',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating initial user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() && auth.currentUser) {
      await createInitialUserProfile(userId, auth.currentUser.email || '');
      return getUserProfile(userId); // Recursively call after creation
    }

    const bookingSettingsRef = doc(db, 'user_booking_settings', userId);
    const bookingSettingsDoc = await getDoc(bookingSettingsRef);
    
    // Create default booking settings if they don't exist
    if (!bookingSettingsDoc.exists() && auth.currentUser) {
      await setDoc(bookingSettingsRef, {
        userId,
        enabled: true,
        maxBookingsPerDay: 20,
        bookingIntervals: 30,
        startTime: '09:00',
        endTime: '18:00',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return getUserProfile(userId); // Recursively call after creation
    }

    const userData = userDoc.data();
    const bookingSettings = bookingSettingsDoc.exists() ? bookingSettingsDoc.data() : null;
    
    return {
      id: userDoc.id,
      ...userData,
      bookingSettings: bookingSettings ? {
        ...bookingSettings,
        createdAt: bookingSettings.createdAt.toDate(),
        updatedAt: bookingSettings.updatedAt.toDate()
      } : undefined
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateBookingSettings = async (
  userId: string, 
  settings: Partial<UserBookingSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, 'user_booking_settings', userId);
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      // Create default settings if they don't exist
      await setDoc(settingsRef, {
        userId,
        enabled: true,
        maxBookingsPerDay: 20,
        bookingIntervals: 30,
        startTime: '09:00',
        endTime: '18:00',
        ...settings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing settings
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating booking settings:', error);
    throw error;
  }
};