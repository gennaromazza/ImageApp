import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

interface EmailVerificationProps {
  returnTo?: string;
  selectedPlan?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ returnTo, selectedPlan }) => {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Controlla periodicamente se l'email è stata verificata
    const checkVerification = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(checkVerification);
          // Se c'è un piano selezionato, torna alla pagina di pricing
          if (selectedPlan) {
            navigate('/pricing');
          } else if (returnTo) {
            navigate(returnTo);
          } else {
            navigate('/dashboard');
          }
        }
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, [navigate, returnTo, selectedPlan]);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    
    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Errore durante l\'invio dell\'email di verifica');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="flex flex-col items-center text-center">
          <Mail className="w-16 h-16 text-[--theater-gold] mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">
            Verifica il tuo indirizzo email
          </h1>
          <p className="text-gray-400 mb-6">
            Abbiamo inviato un'email di verifica a{' '}
            <span className="text-white">{auth.currentUser ? auth.currentUser.email : "Caricamento..."}</span>.
            Controlla la tua casella di posta e clicca sul link per verificare il tuo account.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2 w-full">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-2 w-full">
              <Check size={20} />
              Email di verifica inviata con successo!
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            {sending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Reinvia email di verifica
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;