import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleCalendarCallback } from '../lib/calendar';

const CalendarCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (!user) return;

      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (!code) {
          throw new Error('Codice di autorizzazione mancante');
        }

        await handleGoogleCalendarCallback(code, user.uid);
        
        // Redirect back to the original page
        const returnTo = sessionStorage.getItem('calendarReturnTo') || '/dashboard';
        sessionStorage.removeItem('calendarReturnTo');
        navigate(returnTo);
      } catch (error) {
        console.error('Error handling calendar callback:', error);
        setError('Errore durante la connessione a Google Calendar');
      }
    };

    handleCallback();
  }, [user, location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center"
      >
        <Calendar className="w-16 h-16 text-[--theater-gold] mx-auto mb-6" />
        
        {error ? (
          <>
            <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
              <AlertCircle size={24} />
              <h2 className="text-xl font-semibold">Errore di Connessione</h2>
            </div>
            <p className="text-gray-400">{error}</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
              <Check size={24} />
              <h2 className="text-xl font-semibold">Connessione in corso...</h2>
            </div>
            <p className="text-gray-400">
              Stiamo connettendo il tuo Google Calendar...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CalendarCallbackPage;