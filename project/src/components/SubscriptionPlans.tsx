import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession, getStripePrices, type StripePrice } from '../lib/stripe';
import { STRIPE_CONFIG } from '../config/stripe';
import AuthModal from './auth/AuthModal';

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  React.useEffect(() => {
    const loadPrices = async () => {
      try {
        setError(null);
        const stripePrices = await getStripePrices().catch(() => {
          // Fallback to config prices if Firestore fails
          return [
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
        });
        setPrices(stripePrices);
      } catch (error) {
        console.error('Error loading prices:', error);
        setError('Errore nel caricamento dei piani. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Se l'utente non è loggato, mostra il modal di autenticazione
      setSelectedPriceId(priceId);
      setShowAuthModal(true);
      return;
    }

    // Verifica che l'email sia verificata
    if (!user.emailVerified) {
      navigate('/verify-email', { 
        state: { 
          returnTo: '/pricing',
          selectedPlan: priceId 
        } 
      });
      return;
    }
    
    setProcessing(true);
    setError(null);

    try {
      await createCheckoutSession(
        user.uid,
        priceId,
        `${window.location.origin}/profile/subscription`,
        `${window.location.origin}/pricing`
      );
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Errore durante l\'elaborazione del pagamento. Riprova più tardi.');
      setProcessing(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedPriceId) {
      handleSubscribe(selectedPriceId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 text-[--theater-gold] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {prices.map((price) => (
          <motion.div
            key={price.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-[--theater-gold] transition-all"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {price.interval === 'month' ? 'Piano Mensile' : 'Piano Annuale'}
              </h3>
              <div className="text-4xl font-bold text-[--theater-gold]">
                €{(price.unitAmount / 100).toFixed(2)}
                <span className="text-lg text-gray-400">
                  /{price.interval === 'month' ? 'mese' : 'anno'}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-2 text-white">
                <Check className="text-green-400" />
                Prenotazioni illimitate
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="text-green-400" />
                Dashboard personalizzata
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="text-green-400" />
                Statistiche avanzate
              </li>
              {price.interval === 'year' && (
                <li className="flex items-center gap-2 text-green-400">
                  <Check />
                  2 mesi gratuiti
                </li>
              )}
            </ul>

            <button
              onClick={() => handleSubscribe(price.id)}
              disabled={processing}
              className="w-full py-3 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin" />
                  Elaborazione...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {!user && <LogIn size={20} />}
                  {user ? 'Attiva Abbonamento' : 'Registrati'}
                </span>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setSelectedPriceId(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default SubscriptionPlans;