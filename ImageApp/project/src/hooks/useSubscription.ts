import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscription, type Subscription } from '../lib/subscription';
import { getSubscriptionStatus, type StripeSubscription } from '../lib/stripe';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setStripeSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const [sub, stripeSub] = await Promise.all([
          getSubscription(user.uid),
          getSubscriptionStatus(user.uid)
        ]);
        setSubscription(sub);
        setStripeSubscription(stripeSub);
        setError(null);
      } catch (error) {
        console.error('Error loading subscription:', error);
        setError('Errore nel caricamento dell\'abbonamento');
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [sub, stripeSub] = await Promise.all([
        getSubscription(user.uid),
        getSubscriptionStatus(user.uid)
      ]);
      setSubscription(sub);
      setStripeSubscription(stripeSub);
      setError(null);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setError('Errore durante l\'aggiornamento dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  return {
    subscription,
    stripeSubscription,
    loading,
    error,
    refresh
  };
};