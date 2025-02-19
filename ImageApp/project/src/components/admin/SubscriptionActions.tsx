import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, History, X, Check, AlertCircle, Clock } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { db } from '../../lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { sendSubscriptionNotification } from '../../lib/email';
import type { Subscription } from '../../lib/subscription';

interface SubscriptionActionsProps {
  subscription: Subscription;
  onClose: () => void;
}

const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  subscription,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleExtendSubscription = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newEndDate = addMonths(subscription.endDate, extensionMonths);
      
      await updateDoc(doc(db, 'subscriptions', subscription.userId), {
        endDate: newEndDate,
        status: 'active'
      });

      // Registra l'estensione nello storico
      await addDoc(collection(db, 'subscription_history'), {
        userId: subscription.userId,
        email: subscription.email,
        action: 'extension',
        months: extensionMonths,
        previousEndDate: subscription.endDate,
        newEndDate,
        timestamp: new Date()
      });

      setSuccess(`Abbonamento esteso di ${extensionMonths} ${extensionMonths === 1 ? 'mese' : 'mesi'}`);
      
      // Invia notifica all'utente
      await sendSubscriptionNotification(subscription.email, {
        type: 'extension',
        endDate: newEndDate
      });
    } catch (error) {
      console.error('Error extending subscription:', error);
      setError('Errore durante l\'estensione dell\'abbonamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      setError('Inserisci un messaggio per la notifica');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendSubscriptionNotification(subscription.email, {
        type: 'custom',
        message: notificationMessage
      });

      // Registra la notifica nello storico
      await addDoc(collection(db, 'notification_history'), {
        userId: subscription.userId,
        email: subscription.email,
        message: notificationMessage,
        timestamp: new Date()
      });

      setSuccess('Notifica inviata con successo');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Errore durante l\'invio della notifica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          Gestione Abbonamento
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-2">
            <Check size={20} />
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Estensione abbonamento */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <Calendar className="text-[--theater-gold]" />
              Estendi Abbonamento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Durata estensione (mesi)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                />
              </div>

              <div className="text-sm text-gray-400">
                Nuova data di scadenza:{' '}
                <span className="text-white">
                  {format(addMonths(subscription.endDate, extensionMonths), 'dd MMMM yyyy', { locale: it })}
                </span>
              </div>

              <button
                onClick={handleExtendSubscription}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Check size={20} />
                )}
                Estendi Abbonamento
              </button>
            </div>
          </div>

          {/* Invio notifiche */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <Bell className="text-[--theater-gold]" />
              Invia Notifica
            </h3>

            <div className="space-y-4">
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white h-24 resize-none"
              />

              <button
                onClick={handleSendNotification}
                disabled={loading || !notificationMessage.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Bell size={20} />
                )}
                Invia Notifica
              </button>
            </div>
          </div>

          {/* Storico */}
          <button
            onClick={() => setShowHistory(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            <History size={20} />
            Visualizza Storico
          </button>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative"
              >
                <button
                  onClick={() => setShowHistory(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="text-[--theater-gold]" />
                  Storico Abbonamento
                </h3>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Qui verrà mostrato lo storico delle azioni */}
                  <div className="text-center text-gray-400 py-8">
                    Storico in fase di implementazione
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionActions;