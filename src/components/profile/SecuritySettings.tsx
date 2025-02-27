import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Check } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { updatePassword, sendEmailVerification } from 'firebase/auth';

const SecuritySettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Errore durante l\'invio dell\'email di verifica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg flex items-center gap-2">
          <Check size={20} />
          {auth.currentUser?.emailVerified
            ? 'Password aggiornata con successo!'
            : 'Email di verifica inviata con successo!'}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Password Attuale</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Nuova Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Conferma Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin">⌛</span>
              Aggiornamento in corso...
            </>
          ) : (
            <>
              <Lock size={20} />
              Aggiorna Password
            </>
          )}
        </button>
      </form>

      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Verifica Email</h3>
            <p className="text-gray-400">
              {auth.currentUser?.emailVerified
                ? 'La tua email è verificata'
                : 'Verifica la tua email per accedere a tutte le funzionalità'}
            </p>
          </div>

          {!auth.currentUser?.emailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Mail size={20} />
              )}
              Invia Verifica
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;