import { loadStripe } from '@stripe/stripe-js';
import { db, waitForFirebase } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { STRIPE_CONFIG } from '../config/stripe';

// Initialize Stripe with the public key from config
export const stripePromise = loadStripe(STRIPE_CONFIG.publicKey);

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  type: 'one_time' | 'recurring';
  interval?: 'month' | 'year';
  active: boolean;
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Create checkout session
export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (!priceId) throw new Error('Price ID is required');

  try {
    await waitForFirebase();
    
    const checkoutRef = await addDoc(collection(db, 'stripe_checkout_sessions'), {
      price: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      userId,
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      tax_id_collection: {
        enabled: true
      },
      metadata: {
        userId
      },
      created: new Date()
    });

    // Wait for the CheckoutSession to get attached by the extension
    let retries = 0;
    const maxRetries = 3;

    const waitForSession = new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(
        doc(db, 'stripe_checkout_sessions', checkoutRef.id),
        async (snap) => {
          const { sessionId, error } = snap.data() || {};
          
          if (error) {
            unsubscribe();
            reject(new Error(error.message));
            return;
          }

          if (sessionId) {
            unsubscribe();
            const stripe = await stripePromise;
            if (!stripe) throw new Error('Stripe not initialized');
            await stripe.redirectToCheckout({ sessionId });
            resolve();
            return;
          }

          // Retry logic
          if (retries < maxRetries) {
            retries++;
          } else {
            unsubscribe();
            reject(new Error('Timeout waiting for checkout session'));
          }
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );

      // Set timeout
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for checkout session'));
      }, 10000); // 10 second timeout
    });

    await waitForSession;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Get subscription status with fallback
export const getSubscriptionStatus = async (userId: string): Promise<StripeSubscription | null> => {
  if (!userId) return null;

  try {
    await waitForFirebase();
    
    const subscriptionDoc = await getDoc(doc(db, 'stripe_subscriptions', userId));
    if (!subscriptionDoc.exists()) {
      return null;
    }

    const data = subscriptionDoc.data();
    if (!data.status) return null;

    return {
      id: subscriptionDoc.id,
      status: data.status,
      currentPeriodStart: data.current_period_start?.toDate() || new Date(),
      currentPeriodEnd: data.current_period_end?.toDate() || new Date(),
      cancelAtPeriodEnd: data.cancel_at_period_end || false
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null; // Return null instead of throwing
  }
};

// Get available prices with fallback
export const getStripePrices = async (): Promise<StripePrice[]> => {
  const fallbackPrices: StripePrice[] = [
    {
      id: 'price_monthly',
      productId: 'prod_monthly',
      unitAmount: STRIPE_CONFIG.plans.monthly.price * 100,
      currency: 'eur',
      type: 'recurring',
      interval: 'month',
      active: true
    },
    {
      id: 'price_yearly',
      productId: 'prod_yearly',
      unitAmount: STRIPE_CONFIG.plans.yearly.price * 100,
      currency: 'eur',
      type: 'recurring',
      interval: 'year',
      active: true
    }
  ];

  try {
    await waitForFirebase();

    // Try to get prices from Firestore
    const pricesRef = collection(db, 'stripe_prices');
    const q = query(
      pricesRef, 
      where('active', '==', true),
      orderBy('created', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        productId: doc.data().product,
        unitAmount: doc.data().unit_amount,
        currency: doc.data().currency,
        type: doc.data().type,
        interval: doc.data().recurring?.interval,
        active: doc.data().active
      }));
    }

    // If no prices in Firestore, return fallback prices
    return fallbackPrices;
  } catch (error) {
    console.error('Error getting prices:', error);
    return fallbackPrices; // Return fallback prices on error
  }
};