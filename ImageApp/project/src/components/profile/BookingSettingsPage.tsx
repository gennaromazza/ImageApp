import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Building2, Image, Palette, AlertCircle, Check, Copy, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, updateBookingSettings } from '../../lib/userProfile';
import type { UserBookingSettings } from '../../types/user';
import ColorPicker from '../../components/ColorPicker';

const BookingSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserBookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        setSettings(profile?.bookingSettings || {
          userId: user.uid,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error loading booking settings:', error);
        setError('Errore nel caricamento delle impostazioni');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user || !settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateBookingSettings(user.uid, settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving booking settings:', error);
      setError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const copyBookingUrl = async () => {
    if (!user) return;
    const url = `${window.location.origin}/booking/${user.uid}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const openPreviewBooking = () => {
    if (!user) return;
    window.open(`/booking/${user.uid}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="text-[--theater-gold]" />
          Impostazioni Prenotazioni
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
            Impostazioni salvate con successo
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <Building2 size={16} />
              Nome Attività
            </label>
            <input
              type="text"
              value={settings?.businessName || ''}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                businessName: e.target.value
              } : null)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Il tuo studio fotografico"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <Image size={16} />
              URL Logo
            </label>
            <input
              type="url"
              value={settings?.logoUrl || ''}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                logoUrl: e.target.value
              } : null)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <Palette size={16} />
              Colore Tema
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600"
                style={{ backgroundColor: settings?.themeColor || '#FFD700' }}
              />
              {showColorPicker && (
                <div className="absolute mt-2 z-10">
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ColorPicker
                    color={settings?.themeColor || '#FFD700'}
                    onChange={(color) => setSettings(prev => prev ? {
                      ...prev,
                      themeColor: color
                    } : null)}
                  />
                </div>
              )}
              <span className="text-gray-400">
                {settings?.themeColor || '#FFD700'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enabled ?? true}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  enabled: e.target.checked
                } : null)}
                className="w-4 h-4 rounded accent-[--theater-gold]"
              />
              Abilita prenotazioni
            </label>

            <div className="flex gap-4">
              <button
                onClick={copyBookingUrl}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copia Link
                  </>
                )}
              </button>
              <button
                onClick={openPreviewBooking}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Eye size={20} />
                Anteprima
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Link Prenotazione
        </h3>
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-300 break-all">
            {user ? `${window.location.origin}/booking/${user.uid}` : 'Accedi per vedere il tuo link'}
          </p>
        </div>
        <p className="text-gray-400 mt-4">
          Condividi questo link con i tuoi clienti per permettere loro di prenotare direttamente.
        </p>
      </div>
    </motion.div>
  );
};

export default BookingSettingsPage;