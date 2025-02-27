import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { registerUser, getAuthErrorMessage } from '../../lib/auth';

interface LocationState {
  returnTo?: string;
  selectedPlan?: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { returnTo, selectedPlan } = (location.state as LocationState) || {};

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerUser(formData.email, formData.password);
      // Dopo la registrazione, reindirizza alla verifica email
      navigate('/verify-email', { 
        state: { 
          returnTo,
          selectedPlan 
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus className="text-[--theater-gold]" />
            Registrazione
          </h1>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2" htmlFor="confirmPassword">
              Conferma Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                Registrazione in corso...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Registrati
              </>
            )}
          </button>

          <p className="text-center text-gray-400">
            Hai già un account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[--theater-gold] hover:underline"
            >
              Accedi
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;