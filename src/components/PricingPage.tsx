import React from 'react';
import { motion } from 'framer-motion';
import { Film, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import SubscriptionPlans from './SubscriptionPlans';

const PricingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { user, emailVerified, subscription } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to dashboard if user has active subscription
    if (user && emailVerified && subscription?.status === 'active') {
      navigate('/dashboard');
    }
  }, [user, emailVerified, subscription, navigate]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Film className="w-16 h-16 text-[--theater-gold] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Scegli il piano perfetto per te
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Gestisci il tuo business con facilità grazie a Booking Manager.
            Scegli il piano che meglio si adatta alle tue esigenze.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <SubscriptionPlans />
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p className="mb-4">
            Hai domande? Contattaci a{' '}
            <a href="mailto:gennaro.mazzacane@gmail.com" className="text-[--theater-gold]">
              gennaro.mazzacane@gmail.com
            </a>
          </p>
          <p className="text-sm">
            * L'abbonamento si rinnova automaticamente. Puoi disdire in qualsiasi momento.
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (!emailVerified) {
            navigate('/verify-email');
          }
        }}
      />
    </div>
  );
};

export default PricingPage;