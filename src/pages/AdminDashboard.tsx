import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import AdminPanel from '../components/admin/AdminPanel';
import ProfileLayout from './profile/ProfileLayout';
import ProfilePage from './profile/ProfilePage';
import SubscriptionPage from './profile/SubscriptionPage';
import SecurityPage from './profile/SecurityPage';
import NotificationsPage from './profile/NotificationsPage';
import UsersPage from './admin/UsersPage';
import SubscriptionsPage from './admin/SubscriptionsPage';
import { LogOut, User } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="text-2xl font-marquee text-[--theater-gold]">
              Booking Manager
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                  <User size={18} />
                  <span className="max-w-[150px] truncate">{user?.email}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    to="/dashboard/profile"
                    className="block px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                  >
                    Profilo
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Esci
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AdminPanel />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="profile/*" element={<ProfileLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;