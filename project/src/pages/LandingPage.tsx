import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Film, Calendar, Clock, Star, Users, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, LogIn, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/auth/AuthModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const features = [
    {
      icon: Calendar,
      title: "Prenotazione Semplice",
      description: "Prenota il tuo servizio fotografico in pochi click"
    },
    {
      icon: Clock,
      title: "Risparmia Tempo",
      description: "Gestisci tutte le tue prenotazioni in un unico posto"
    },
    {
      icon: Users,
      title: "Gestione Clienti",
      description: "Organizza e monitora facilmente i tuoi clienti"
    }
  ];

  const testimonials = [
    {
      name: "Marco Rossi",
      role: "Fotografo Professionista",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      text: "Da quando uso questa piattaforma, la gestione delle prenotazioni è diventata molto più efficiente.",
      rating: 5
    },
    {
      name: "Laura Bianchi",
      role: "Studio Fotografico",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      text: "Un sistema intuitivo che mi ha permesso di aumentare la produttività del mio studio.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "Come funziona il sistema di prenotazione?",
      answer: "Il sistema permette ai clienti di prenotare servizi fotografici scegliendo data e ora disponibili. Potrai gestire le prenotazioni dal tuo dashboard personale."
    },
    {
      question: "Quali sono i costi del servizio?",
      answer: "Offriamo diversi piani di abbonamento per adattarci alle tue esigenze. Visita la nostra pagina dei prezzi per maggiori dettagli."
    },
    {
      question: "Posso personalizzare gli orari disponibili?",
      answer: "Sì, puoi impostare i tuoi orari di lavoro, pause e giorni di chiusura dal pannello di amministrazione."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Film className="w-8 h-8 text-[--theater-gold]" />
              <span className="text-xl font-bold text-white">BookingManager</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Funzionalità
              </a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">
                Recensioni
              </a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  {/* Mobile Login Button - Always visible */}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
                  >
                    <LogIn size={18} />
                    <span>Admin</span>
                  </button>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-gray-800 border-t border-gray-700"
              >
                <div className="container mx-auto px-4 py-2">
                  <a href="#features" className="block py-2 text-gray-300 hover:text-white">
                    Funzionalità
                  </a>
                  <a href="#testimonials" className="block py-2 text-gray-300 hover:text-white">
                    Recensioni
                  </a>
                  <a href="#faq" className="block py-2 text-gray-300 hover:text-white">
                    FAQ
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Gestisci le tue prenotazioni con stile
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              La piattaforma professionale per fotografi che vogliono semplificare
              la gestione delle prenotazioni e concentrarsi sulla loro arte.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-[--theater-gold] text-black rounded-lg text-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Inizia Gratuitamente
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Come Funziona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-[--theater-gold] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Cosa Dicono i Nostri Clienti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gray-800 p-6 rounded-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{testimonial.text}</p>
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[--theater-gold] fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Domande Frequenti
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  {activeAccordion === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {activeAccordion === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-300">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-[--theater-gold] rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">
              Pronto a Iniziare?
            </h2>
            <p className="text-black/80 mb-8 max-w-2xl mx-auto">
              Unisciti a migliaia di professionisti che hanno già scelto la nostra piattaforma
              per gestire le loro prenotazioni.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Registrati Ora
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Vedi i Prezzi
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Film className="w-6 h-6 text-[--theater-gold]" />
                <span className="text-lg font-bold text-white">BookingManager</span>
              </div>
              <p className="text-gray-400">
                La soluzione professionale per la gestione delle prenotazioni fotografiche.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Link Utili</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    Prezzi
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contatti</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">
                  Email: info@bookingmanager.com
                </li>
                <li className="text-gray-400">
                  Tel: +39 123 456 7890
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Social</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} BookingManager. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default LandingPage;