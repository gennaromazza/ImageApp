import React from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Lock, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: User, label: 'Profilo', path: '/dashboard/profile' },
  { icon: CreditCard, label: 'Abbonamento', path: '/dashboard/subscription' },
  { icon: Lock, label: 'Sicurezza', path: '/dashboard/security' },
  { icon: Bell, label: 'Notifiche', path: '/dashboard/notifications' },
];

const ProfileMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-4"
    >
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <div className="w-12 h-12 rounded-full bg-[--theater-gold] flex items-center justify-center">
          <User className="w-6 h-6 text-black" />
        </div>
        <div>
          <h3 className="text-white font-medium">{user?.email}</h3>
          <p className="text-gray-400 text-sm">Account Business</p>
        </div>
      </div>

      <nav className="mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <item.icon size={18} />
                {item.label}
              </motion.button>
            </li>
          ))}
          <li>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            >
              <LogOut size={18} />
              Esci
            </motion.button>
          </li>
        </ul>
      </nav>
    </motion.div>
  );
};

export default ProfileMenu;