import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { format, differenceInDays, isValid } from 'date-fns';
import { it } from 'date-fns/locale';

const SubscriptionStatus: React.FC = () => {
  const { subscription } = useAuth();

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500 rounded-lg p-6 flex items-start gap-4"
      >
        <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
        <div>
          <h3 className="text-lg font-medium text-red-500">Nessun abbonamento attivo</h3>
          <p className="text-gray-400 mt-1">
            Per utilizzare tutte le funzionalità, attiva un abbonamento.
          </p>
        </div>
      </motion.div>
    );
  }

  const isActive = subscription.status === 'active';
  const endDate = new Date(subscription.endDate);
  
  // Only calculate days left if we have a valid end date
  const daysLeft = isValid(endDate) ? differenceInDays(endDate, new Date()) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className={`rounded-lg p-6 flex items-start gap-4 ${
        isActive ? 'bg-green-500/10 border border-green-500' : 'bg-red-500/10 border border-red-500'
      }`}>
        {isActive ? (
          <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500 mt-1" />
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-white">
              Piano {subscription.plan === 'monthly' ? 'Mensile' : 'Annuale'}
            </h3>
            <span className={`px-2 py-0.5 rounded text-sm ${
              isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isActive ? 'Attivo' : 'Scaduto'}
            </span>
          </div>
          
          <div className="mt-4 space-y-2">
            {isValid(endDate) && (
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Scade il {format(endDate, 'd MMMM yyyy', { locale: it })}
                  {isActive && daysLeft > 0 && ` (${daysLeft} giorni rimanenti)`}
                </span>
              </div>
            )}
            
            {subscription.paypalSubscriptionId && (
              <div className="flex items-center gap-2 text-gray-400">
                <CreditCard className="w-4 h-4" />
                <span>Rinnovo automatico attivo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {subscription.plan === 'trial' && (
        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-6">
          <h4 className="text-blue-400 font-medium mb-2">Piano di prova</h4>
          <p className="text-gray-400">
            Stai utilizzando il piano di prova gratuito. Hai ancora {subscription.maxBookings - subscription.bookingsUsed} prenotazioni disponibili.
          </p>
        </div>
      )}

      {!isActive && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
        >
          Rinnova Abbonamento
        </motion.button>
      )}
    </motion.div>
  );
};

export default SubscriptionStatus;