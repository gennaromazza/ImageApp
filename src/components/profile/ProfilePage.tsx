import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { updateProfile } from 'firebase/auth';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(user, {
        displayName: formData.displayName
      });
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="text-[--theater-gold]" />
          Profilo
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
            Profilo aggiornato con successo!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 mb-2">Email</label>
              <div className="flex items-center gap-2 text-white bg-gray-700 p-3 rounded">
                <Mail className="text-[--theater-gold]" size={20} />
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Telefono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Inserisci il tuo numero"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-2">Nome Azienda</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Nome della tua azienda"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Save size={20} />
              )}
              Salva Modifiche
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfilePage;