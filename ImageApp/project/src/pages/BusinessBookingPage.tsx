import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, AlertCircle } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import { getUserProfile } from '../lib/userProfile';
import type { UserBookingSettings } from '../types/user';

const BusinessBookingPage = () => {
  const { customUrl } = useParams<{ customUrl: string }>();
  const [settings, setSettings] = useState<UserBookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!customUrl) {
        setError('URL non valido');
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(customUrl);
        if (!profile?.bookingSettings) {
          setError('Pagina di prenotazione non trovata');
        } else if (!profile.bookingSettings.enabled) {
          setError('Le prenotazioni sono temporaneamente disabilitate');
        } else {
          setSettings(profile.bookingSettings);
        }
      } catch (error) {
        console.error('Error loading business settings:', error);
        setError('Errore nel caricamento della pagina');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [customUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-lg max-w-md w-full flex items-center gap-3">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <div className="flex items-center gap-4 justify-center mb-8">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.businessName}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <Film 
                className="w-16 h-16" 
                style={{ color: settings.themeColor || '#FFD700' }} 
              />
            )}
            <h1 
              className="text-4xl font-marquee"
              style={{ color: settings.themeColor || '#FFD700' }}
            >
              {settings.businessName}
            </h1>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          <h2 className="text-3xl text-white text-center mb-8 font-marquee">
            Prenota il tuo servizio fotografico
          </h2>
          <BookingForm businessId={settings.userId} />
        </main>
      </div>
    </div>
  );
};

export default BusinessBookingPage;