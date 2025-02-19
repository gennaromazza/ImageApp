import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building2, Clock, Globe, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateBookingSettings } from '../lib/userProfile';
import { checkCustomUrlAvailability } from '../lib/booking';
import ColorPicker from '../components/ColorPicker';

const steps = [
  {
    id: 'business',
    title: 'Informazioni Attività',
    icon: Building2
  },
  {
    id: 'schedule',
    title: 'Orari e Disponibilità',
    icon: Clock
  },
  {
    id: 'customization',
    title: 'Personalizzazione',
    icon: Globe
  }
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    logoUrl: '',
    customUrl: '',
    startTime: '09:00',
    endTime: '18:00',
    bookingDuration: 30,
    themeColor: '#FFD700'
  });

  useEffect(() => {
    if (!user) {
      navigate('/pricing');
    }
  }, [user, navigate]);

  const handleNext = async () => {
    setError(null);

    // Validazione per ogni step
    if (currentStep === 0) {
      if (!formData.businessName) {
        setError('Inserisci il nome della tua attività');
        return;
      }
    } else if (currentStep === 1) {
      const startHour = parseInt(formData.startTime.split(':')[0]);
      const endHour = parseInt(formData.endTime.split(':')[0]);
      if (startHour >= endHour) {
        setError('L\'orario di fine deve essere successivo all\'orario di inizio');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.customUrl) {
        setError('Inserisci un URL personalizzato');
        return;
      }

      // Verifica disponibilità URL
      try {
        const isAvailable = await checkCustomUrlAvailability(formData.customUrl);
        if (!isAvailable) {
          setError('Questo URL non è disponibile');
          return;
        }
      } catch (error) {
        setError('Errore durante la verifica dell\'URL');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Salva le impostazioni
      await updateBookingSettings(user.uid, {
        businessName: formData.businessName,
        logoUrl: formData.logoUrl || undefined,
        customUrl: formData.customUrl,
        themeColor: formData.themeColor,
        enabled: true
      });

      // Reindirizza alla dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Errore durante il salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-gray-300 mb-2">Nome Attività</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  businessName: e.target.value
                }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Il tuo studio fotografico"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Logo URL (opzionale)</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  logoUrl: e.target.value
                }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Orario Apertura</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    startTime: e.target.value
                  }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Orario Chiusura</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    endTime: e.target.value
                  }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Durata Appuntamenti</label>
              <select
                value={formData.bookingDuration}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  bookingDuration: parseInt(e.target.value)
                }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value={15}>15 minuti</option>
                <option value={30}>30 minuti</option>
                <option value={45}>45 minuti</option>
                <option value={60}>1 ora</option>
              </select>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-gray-300 mb-2">URL Personalizzato</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {window.location.origin}/b/
                </span>
                <input
                  type="text"
                  value={formData.customUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customUrl: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  }))}
                  className="w-full pl-[140px] p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="il-tuo-studio"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Colore Tema</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600"
                  style={{ backgroundColor: formData.themeColor }}
                />
                {showColorPicker && (
                  <div className="absolute mt-2 z-10">
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setShowColorPicker(false)}
                    />
                    <ColorPicker
                      color={formData.themeColor}
                      onChange={(color) => setFormData(prev => ({
                        ...prev,
                        themeColor: color
                      }))}
                    />
                  </div>
                )}
                <span className="text-gray-400">
                  {formData.themeColor}
                </span>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Calendar className="w-16 h-16 text-[--theater-gold] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Configura il tuo Calendario
            </h1>
            <p className="text-gray-400">
              Completa questi passaggi per iniziare a ricevere prenotazioni
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center"
                >
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full
                      ${index <= currentStep
                        ? 'bg-[--theater-gold] text-black'
                        : 'bg-gray-700 text-gray-400'
                      }
                    `}
                  >
                    {index < currentStep ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-full h-1 mx-2
                        ${index < currentStep ? 'bg-[--theater-gold]' : 'bg-gray-700'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2"
                >
                  <AlertCircle size={20} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {renderStep()}

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check size={20} />
                        Completa
                      </>
                    ) : (
                      <>
                        <ArrowRight size={20} />
                        Avanti
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-gray-400">
            <p>
              Potrai modificare queste impostazioni in qualsiasi momento dalla dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;