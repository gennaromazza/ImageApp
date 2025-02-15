import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveNotificationSettings, getNotificationSettings, type NotificationSetting } from '../../lib/notifications';
import { sendSubscriptionNotification } from '../../lib/email';

const defaultSettings: NotificationSetting[] = [
  {
    id: 'subscription_expiring',
    enabled: true,
    template: {
      subject: 'Il tuo abbonamento sta per scadere',
      body: 'Il tuo abbonamento scadrà tra {days_left} giorni. Rinnova ora per continuare ad utilizzare tutti i servizi.'
    }
  },
  {
    id: 'subscription_expired',
    enabled: true,
    template: {
      subject: 'Il tuo abbonamento è scaduto',
      body: 'Il tuo abbonamento è scaduto. Rinnova ora per riprendere ad utilizzare tutti i servizi.'
    }
  },
  {
    id: 'subscription_renewed',
    enabled: true,
    template: {
      subject: 'Abbonamento rinnovato con successo',
      body: 'Grazie per aver rinnovato il tuo abbonamento! Il tuo nuovo periodo di abbonamento è attivo fino al {expiry_date}.'
    }
  }
];

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        const savedSettings = await getNotificationSettings(user.uid);
        if (savedSettings) {
          // Convert saved settings back to array format
          const settingsArray = Object.entries(savedSettings.settings).map(([id, data]) => ({
            id,
            ...data as Omit<NotificationSetting, 'id'>
          }));
          setSettings(settingsArray);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setError('Errore nel caricamento delle preferenze di notifica');
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      setError('Utente non autenticato');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // First save the settings
      await saveNotificationSettings(user.uid, settings);

      // Then try to send a test notification if any notifications are enabled
      if (settings.some(s => s.enabled)) {
        const notificationSent = await sendSubscriptionNotification(user.email!, {
          type: 'custom',
          message: 'Questa è una notifica di test. Le tue preferenze di notifica sono state aggiornate con successo!'
        });

        if (!notificationSent) {
          setError('Le preferenze sono state salvate ma non è stato possibile inviare la notifica di test');
        } else {
          setSuccess(true);
        }
      } else {
        setSuccess(true);
      }

      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError('Errore durante il salvataggio delle preferenze');
    } finally {
      setSaving(false);
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
          <Bell className="text-[--theater-gold]" />
          Notifiche
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
            Preferenze salvate con successo
          </div>
        )}

        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={(e) => {
                        const updatedSettings = settings.map(s =>
                          s.id === setting.id ? { ...s, enabled: e.target.checked } : s
                        );
                        setSettings(updatedSettings);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[--theater-gold]"></div>
                  </label>
                  <h3 className="text-lg font-medium text-white">
                    {setting.id === 'subscription_expiring' && 'Abbonamento in Scadenza'}
                    {setting.id === 'subscription_expired' && 'Abbonamento Scaduto'}
                    {setting.id === 'subscription_renewed' && 'Abbonamento Rinnovato'}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingTemplate(editingTemplate === setting.id ? null : setting.id)}
                  className="text-[--theater-gold] hover:text-yellow-500 transition-colors"
                >
                  {editingTemplate === setting.id ? 'Chiudi' : 'Personalizza'}
                </button>
              </div>

              {editingTemplate === setting.id && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Oggetto Email</label>
                    <input
                      type="text"
                      value={setting.template.subject}
                      onChange={(e) => {
                        const updatedSettings = settings.map(s =>
                          s.id === setting.id
                            ? { ...s, template: { ...s.template, subject: e.target.value } }
                            : s
                        );
                        setSettings(updatedSettings);
                      }}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Testo Email</label>
                    <textarea
                      value={setting.template.body}
                      onChange={(e) => {
                        const updatedSettings = settings.map(s =>
                          s.id === setting.id
                            ? { ...s, template: { ...s.template, body: e.target.value } }
                            : s
                        );
                        setSettings(updatedSettings);
                      }}
                      rows={4}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                    />
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>Variabili disponibili:</p>
                    <ul className="list-disc list-inside mt-1">
                      {setting.id === 'subscription_expiring' && (
                        <li>{'{days_left}'} - Giorni rimanenti alla scadenza</li>
                      )}
                      {setting.id === 'subscription_renewed' && (
                        <li>{'{expiry_date}'} - Data di scadenza del nuovo abbonamento</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
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
                <Save size={20} />
                Salva Preferenze
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;