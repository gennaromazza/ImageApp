import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, Check, Loader, RefreshCw, LogOut, X } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import {
  syncAllBookingsToGoogleCalendar,
  GOOGLE_CONFIG,
  DetailedSyncResult,
  Booking
} from '../../lib/calendar';

const GoogleCalendarSettings: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [syncDetails, setSyncDetails] = useState<DetailedSyncResult | null>(null);

  useEffect(() => {
    console.log('GoogleCalendarSettings: useEffect -> checkCalendarConnection()');
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    console.log('checkCalendarConnection: start');
    if (!auth.currentUser) {
      console.log('checkCalendarConnection: no currentUser, skip');
      setLoading(false);
      return;
    }
    try {
      console.log('checkCalendarConnection: runTransaction...');
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          console.log('checkCalendarConnection: userDoc does not exist, create new userDoc');
          transaction.set(userRef, {
            email: auth.currentUser!.email,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setConnected(false);
        } else {
          const data = userDoc.data();
          const hasToken = !!data?.googleCalendarToken;
          console.log('checkCalendarConnection: userDoc found, hasToken?', hasToken);
          setConnected(hasToken);
        }
      });
    } catch (err) {
      console.error('Errore durante la verifica della connessione:', err);
      setError('Errore durante la verifica della connessione');
    } finally {
      setLoading(false);
      console.log('checkCalendarConnection: end');
    }
  };

  const handleConnect = () => {
    console.log('handleConnect: start');
    if (!auth.currentUser) {
      setError('Devi essere autenticato per connettere il calendario');
      console.log('handleConnect: no currentUser, returning');
      return;
    }
    if (!GOOGLE_CONFIG.clientId) {
      setError('Configurazione Google Calendar non disponibile');
      console.log('handleConnect: no clientId, returning');
      return;
    }
    try {
      const scope = encodeURIComponent(GOOGLE_CONFIG.scopes.join(' '));
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CONFIG.clientId}&redirect_uri=${GOOGLE_CONFIG.redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      console.log('handleConnect: redirecting to', authUrl);
      sessionStorage.setItem('calendarReturnTo', window.location.pathname);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Errore durante la connessione a Google Calendar:', err);
      setError('Errore durante la connessione a Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    console.log('handleDisconnect: start');
    if (!auth.currentUser) {
      setError('Devi essere autenticato per disconnettere il calendario');
      console.log('handleDisconnect: no currentUser, returning');
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists()) {
          console.log('handleDisconnect: removing googleCalendarToken from userDoc');
          transaction.update(userRef, { googleCalendarToken: null, updatedAt: new Date() });
        }
      });
      setConnected(false);
    } catch (err) {
      console.error('Errore durante la disconnessione da Google Calendar:', err);
      setError('Errore durante la disconnessione da Google Calendar');
    }
  };

  const handleSync = async () => {
    console.log('🔄 Avvio sincronizzazione con Google Calendar...');
    if (!auth.currentUser) {
        setError('⚠️ Devi essere autenticato per sincronizzare le prenotazioni');
        return;
    }

    try {
        setSyncing(true);
        const syncResult = await syncAllBookingsToGoogleCalendar(auth.currentUser.uid);

        console.log('✅ Sincronizzazione completata:', syncResult);

        // 🔹 Calcola il numero totale di eventi attesi su Google Calendar
        const totalEvents = syncResult.added.length + syncResult.updated.length;

     setSyncDetails({
    added: syncResult.added,    // Rimuovi .length per mantenere l'array
    updated: syncResult.updated, // Rimuovi .length
    deleted: syncResult.deleted, // Rimuovi .length
    total: totalEvents // Questo può rimanere un numero
});


        setSuccess(true);
        setModalVisible(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
        console.error('❌ Errore durante la sincronizzazione:', err);
        setError('Errore durante la sincronizzazione delle prenotazioni');
    } finally {
        setSyncing(false);
    }
};


  const closeModal = () => {
    console.log('closeModal: setModalVisible(false)');
    setModalVisible(false);
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
          {connected && (
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
          )}
          {connected ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-6 py-2 rounded transition-colors bg-red-500 text-white hover:bg-red-600"
            >
              <LogOut size={20} />
              Disconnetti
            </motion.button>
          ) : (
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

      {modalVisible && syncDetails && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={closeModal}></div>
          <div className="bg-gray-800 rounded-lg p-6 z-10 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-white">Dettagli Sincronizzazione</h3>
              <button onClick={closeModal} className="text-white">
                <X size={20} />
              </button>
            </div>
            <ul className="text-gray-300">
              <li><strong>Aggiunte:</strong> {syncDetails.added.length}</li>
              <ul className="ml-4 mb-4">
                {syncDetails.added.map((b: Booking) => (
                  <li key={b.id}>- {b.summary} (ID: {b.id})</li>
                ))}
              </ul>
              <li><strong>Modificate:</strong> {syncDetails.updated.length}</li>
              <ul className="ml-4 mb-4">
                {syncDetails.updated.map((b: Booking) => (
                  <li key={b.id}>- {b.summary} (ID: {b.id})</li>
                ))}
              </ul>
              <li><strong>Eliminate:</strong> {syncDetails.deleted.length}</li>
              <ul className="ml-4">
                {syncDetails.deleted.map((b: Booking) => (
                  <li key={b.id}>- {b.summary} (ID: {b.id})</li>
                ))}
              </ul>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;
