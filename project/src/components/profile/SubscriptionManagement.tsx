import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Settings, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerPortalUrl } from '../../lib/stripe';

const SubscriptionManagement = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      await getCustomerPortalUrl(
        user.uid,
        `${window.location.origin}/profile/subscription`
      );
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      setError('Errore durante l\'accesso al portale clienti');
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CreditCard className="text-[--theater-gold]" />
          Gestione Abbonamento
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Piano Attuale</p>
              <p className="text-gray-400">
                {subscription.plan === 'monthly' ? 'Mensile' : 'Annuale'}
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              <Settings size={18} />
              {loading ? 'Caricamento...' : 'Gestisci'}
            </button>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <p className="text-white font-medium">Prossimo Rinnovo</p>
            <p className="text-gray-400">
              {subscription.currentPeriodEnd.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;