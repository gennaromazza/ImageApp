import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, Check, Loader, RefreshCw } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { syncAllBookingsToGoogleCalendar, GOOGLE_CONFIG } from '../../lib/calendar';

const GoogleCalendarSettings: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          transaction.set(userRef, {
            email: auth.currentUser!.email,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setConnected(false);
        } else {
          const data = userDoc.data();
          setConnected(!!data?.googleCalendarToken);
        }
      });
    } catch (err) {
      console.error('Errore durante la verifica della connessione:', err);
      setError('Errore durante la verifica della connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!auth.currentUser) {
      setError('Devi essere autenticato per connettere il calendario');
      return;
    }
    if (!GOOGLE_CONFIG.clientId) {
      setError('Configurazione Google Calendar non disponibile');
      return;
    }
    try {
      const scope = encodeURIComponent(GOOGLE_CONFIG.scopes.join(' '));
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CONFIG.clientId}&redirect_uri=${GOOGLE_CONFIG.redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      sessionStorage.setItem('calendarReturnTo', window.location.pathname);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Errore durante la connessione a Google Calendar:', err);
      setError('Errore durante la connessione a Google Calendar');
    }
  };

  const handleSync = async () => {
    if (!auth.currentUser) {
      setError('Devi essere autenticato per sincronizzare le prenotazioni');
      return;
    }
    try {
      setSyncing(true);
      await syncAllBookingsToGoogleCalendar(auth.currentUser.uid);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Errore durante la sincronizzazione:', err);
      setError('Errore durante la sincronizzazione delle prenotazioni');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg flex items-center gap-2">
          <Check size={20} />
          Prenotazioni sincronizzate con successo!
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-white mb-2">
            {connected ? 'Calendario Connesso' : 'Connetti Google Calendar'}
          </h4>
          <p className="text-gray-400">
            {connected
              ? 'Le tue prenotazioni verranno automaticamente sincronizzate con il tuo Google Calendar'
              : 'Connetti il tuo Google Calendar per sincronizzare automaticamente le prenotazioni'}
          </p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-2 rounded transition-colors bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {syncing ? <Loader className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            Sincronizza
          </motion.button>
          {!connected && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              className="flex items-center gap-2 px-6 py-2 rounded transition-colors bg-green-500 text-white hover:bg-green-600"
            >
              <Calendar size={20} />
              Connetti
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarSettings;
