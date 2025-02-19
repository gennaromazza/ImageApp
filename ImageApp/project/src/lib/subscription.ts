import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendSubscriptionNotification } from './email';

export interface Subscription {
  id: string;
  userId: string;
  plan: 'monthly' | 'yearly' | 'trial';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  maxBookings: number;
  bookingsUsed: number;
  stripeSubscriptionId?: string;
  paypalSubscriptionId?: string;
}

export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'subscriptions', userId));
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      plan: data.plan,
      status: data.status,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      maxBookings: data.maxBookings || 0,
      bookingsUsed: data.bookingsUsed || 0,
      stripeSubscriptionId: data.stripeSubscriptionId,
      paypalSubscriptionId: data.paypalSubscriptionId
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
};

export const createSubscription = async (
  userId: string,
  plan: 'monthly' | 'yearly',
  stripeSubscriptionId?: string
): Promise<Subscription> => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + (plan === 'yearly' ? 12 : 1));

  const subscriptionData: Omit<Subscription, 'id'> = {
    userId,
    plan,
    status: 'active',
    startDate: now,
    endDate,
    maxBookings: plan === 'yearly' ? 1000 : 100,
    bookingsUsed: 0,
    stripeSubscriptionId
  };

  try {
    await setDoc(doc(db, 'subscriptions', userId), {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: userId,
      ...subscriptionData
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const activateSubscription = async (
  userId: string,
  plan: 'monthly' | 'yearly',
  source: 'stripe' | 'paypal' | 'admin_activation',
  subscriptionId?: string
): Promise<void> => {
  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + (plan === 'yearly' ? 12 : 1));

    const subscriptionRef = doc(db, 'subscriptions', userId);
    const userRef = doc(db, 'users', userId);

    // Get user email for notification
    const userDoc = await getDoc(userRef);
    const userEmail = userDoc.data()?.email;

    // Update or create subscription
    await setDoc(subscriptionRef, {
      userId,
      plan,
      status: 'active',
      startDate: now,
      endDate,
      maxBookings: plan === 'yearly' ? 1000 : 100,
      bookingsUsed: 0,
      ...(source === 'stripe' && { stripeSubscriptionId: subscriptionId }),
      ...(source === 'paypal' && { paypalSubscriptionId: subscriptionId }),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update user document
    await updateDoc(userRef, {
      'subscription.status': 'active',
      'subscription.plan': plan,
      'subscription.endDate': endDate,
      updatedAt: serverTimestamp()
    });

    // Send notification email
    if (userEmail) {
      await sendSubscriptionNotification(userEmail, {
        type: 'extension',
        endDate
      });
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
};

export const updateSubscriptionStatus = async (
  userId: string,
  status: 'active' | 'expired' | 'cancelled'
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await updateDoc(subscriptionRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'subscription.status': status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};

export const incrementBookingCount = async (userId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    await updateDoc(subscriptionRef, {
      bookingsUsed: serverTimestamp.increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error incrementing booking count:', error);
    throw error;
  }
};