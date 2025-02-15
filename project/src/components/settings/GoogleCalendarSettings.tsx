import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Link2, AlertCircle, Check, Unlink, Loader } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/calendar/callback`;

const GoogleCalendarSettings: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Use transaction to ensure atomic read/write
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
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
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      // Don't show permission errors to user
      if (error.code === 'permission-denied') {
        setConnected(false);
      } else {
        setError('Errore durante la verifica della connessione');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!auth.currentUser) {
      setError('Devi essere autenticato per connettere il calendario');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setError('Configurazione Google Calendar non disponibile');
      return;
    }

    try {
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      
      // Store the current URL to redirect back after auth
      sessionStorage.setItem('calendarReturnTo', window.location.pathname);
      
      // Redirect to Google auth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      setError('Errore durante la connessione a Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    if (!auth.currentUser) {
      setError('Devi essere autenticato per disconnettere il calendario');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use transaction for atomic update
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        transaction.update(userRef, {
          googleCalendarToken: null,
          googleCalendarRefreshToken: null,
          calendarConnected: false,
          updatedAt: new Date()
        });
      });

      setConnected(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      if (error.code === 'permission-denied') {
        setError('Non hai i permessi per disconnettere il calendario');
      } else {
        setError('Errore durante la disconnessione del calendario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400">
        <Loader className="animate-spin" size={20} />
        <span>Verifica connessione...</span>
      </div>
    );
  }

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
          {connected ? 'Calendario connesso con successo!' : 'Calendario disconnesso con successo!'}
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connected ? handleDisconnect : handleConnect}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2 rounded transition-colors ${
            connected
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-[--theater-gold] text-black hover:bg-yellow-500'
          } disabled:opacity-50`}
        >
          {loading ? (
            <span className="animate-spin">⌛</span>
          ) : connected ? (
            <>
              <Unlink size={20} />
              Disconnetti
            </>
          ) : (
            <>
              <Link2 size={20} />
              Connetti
            </>
          )}
        </motion.button>
      </div>

      {connected && (
        <div className="text-sm text-gray-400">
          <p>
            Le nuove prenotazioni verranno automaticamente aggiunte al tuo Google Calendar.
            Puoi disconnettere il calendario in qualsiasi momento.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;