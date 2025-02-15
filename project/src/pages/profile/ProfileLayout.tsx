import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { icon: User, label: 'Profilo', path: '/profile' },
  { icon: Lock, label: 'Sicurezza', path: '/profile/security' }
];

const ProfileLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <nav>
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded transition-colors ${
                          location.pathname === item.path
                            ? 'bg-[--theater-gold] text-black'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
          <div className="md:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;