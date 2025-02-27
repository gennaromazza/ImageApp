import React, { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import AuthModal from './AuthModal';

const LoginButton: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse w-24 h-10 bg-gray-700 rounded-lg" />
    );
  }

  if (user) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <User size={18} />
          <span className="max-w-[150px] truncate">{user.email}</span>
        </button>
        
        <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
          >
            <LogOut size={18} />
            Esci
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
      >
        <LogIn size={18} />
        Accedi
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default LoginButton;