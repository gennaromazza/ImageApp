import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import IntroAnimations from '../components/animations/IntroAnimations';
import Countdown from '../components/Countdown';
import { useSettings } from '../hooks/useSettings';

const BookingPage = () => {
  const { settings, loading: settingsLoading } = useSettings();
  const [showIntro, setShowIntro] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Handle intro animation
  useEffect(() => {
    if (settings?.animation?.enabled) {
      const timer = setTimeout(() => setShowIntro(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowIntro(false);
    }
  }, [settings?.animation?.enabled]);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl flex items-center gap-2"
        >
          <div className="animate-spin">⌛</div>
          Caricamento...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && settings?.animation?.enabled && (
          <IntroAnimations
            type={settings.animation.type}
            title={settings.animation.title || 'Carnevale 2025'}
            subtitle={settings.animation.subtitle || '3... 2... 1...'}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-8">
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center items-center mb-8"
            >
              {settings?.company.logo ? (
                <img 
                  src={settings.company.logo} 
                  alt={settings.company.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Film className="w-12 h-12 text-[--theater-gold]" />
              )}
              <h1 className="text-4xl md:text-5xl font-marquee text-[--theater-gold] ml-4">
                {settings?.company.name || 'Image Studio'}
              </h1>
            </motion.div>

            {settings?.showCountdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <Countdown 
                  targetDate={settings.countdownDate} 
                  eventName={settings.eventName}
                />
              </motion.div>
            )}
          </header>

          <main className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl text-white text-center mb-8 font-marquee"
            >
              Prenota il tuo servizio fotografico
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-8"
            >
              <BookingForm />
            </motion.div>
          </main>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center text-gray-400"
          >
            <div className="space-y-2">
              <p className="text-sm md:text-base">
                {settings?.company.address}
              </p>
              {settings?.company.phone && (
                <p className="text-sm md:text-base">
                  Tel: {settings.company.phone}
                </p>
              )}
              {settings?.company.email && (
                <p className="text-sm md:text-base">
                  Email: {settings.company.email}
                </p>
              )}
            </div>
          </motion.footer>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingPage;