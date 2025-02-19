import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Settings, Home, Menu, X, Users, Package2, 
  Image, ChevronRight, LogOut, User, PieChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import Navbar from './Navbar';
import AuthModal from '../auth/AuthModal';

// Navigation items configuration
const mainTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/prenota', icon: Calendar, label: 'Prenotazioni' },
  { path: '/profile', icon: User, label: 'Profilo' }
];

const adminMenuItems = [
  { path: '/dashboard', icon: Settings, label: 'Dashboard' },

  { 
    path: '/dashboard/admin/financial-dashboard', 
    icon: PieChart,
    label: 'Finanza' 
  },
  
];

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate('/profile');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar onMenuClick={() => setDrawerOpen(true)} />

      {/* Side Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-gray-800 z-50 shadow-xl"
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4">
                {user && (
                  <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[--theater-gold] flex items-center justify-center">
                        <User className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.email}</div>
                        <div className="text-sm text-gray-400">
                          {isAdmin ? 'Amministratore' : 'Utente'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="space-y-2">
                  {mainTabs.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        if (item.path === '/profile') {
                          handleProfileClick();
                        } else {
                          navigate(item.path);
                        }
                        setDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-[--theater-gold] text-black'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                      <ChevronRight size={16} className="ml-auto" />
                    </button>
                  ))}

                  {isAdmin && (
                    <>
                      <div className="my-4 border-t border-gray-700" />
                      {adminMenuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive(item.path)
                              ? 'bg-[--theater-gold] text-black'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <item.icon size={20} />
                          <span>{item.label}</span>
                          <ChevronRight size={16} className="ml-auto" />
                        </button>
                      ))}
                    </>
                  )}
                </nav>

                {user && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Esci</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <Outlet />
      </motion.main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          navigate('/profile');
        }}
      />
    </div>
  );
};

export default Layout;