import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, RefreshCw, AlertCircle, Check, UserPlus } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { activateSubscription } from '../../lib/subscription';
import type { UserData } from '../../lib/auth';

const UsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activatingSubscription, setActivatingSubscription] = useState(false);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
          subscription: doc.data().subscription ? {
            ...doc.data().subscription,
            endDate: doc.data().subscription.endDate?.toDate()
          } : undefined
        })) as UserData[];
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setError('Errore nel caricamento degli utenti');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleActivateSubscription = async (userId: string, email: string) => {
    setActivatingSubscription(true);
    setError(null);

    try {
      await activateSubscription(userId, 'monthly', 'admin_activation');
      await updateDoc(doc(db, 'users', userId), {
        subscription: {
          status: 'active',
          plan: 'monthly',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error activating subscription:', error);
      setError('Errore durante l\'attivazione dell\'abbonamento');
    } finally {
      setActivatingSubscription(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: UserData['status']) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Errore durante l\'aggiornamento dello stato utente');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-[--theater-gold]" />
              Gestione Utenti
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
              title="Aggiorna"
            >
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per email o nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="all">Tutti i ruoli</option>
                <option value="user">Utenti</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'pending')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="suspended">Sospesi</option>
                <option value="pending">In attesa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400">Email</th>
                  <th className="text-left p-4 text-gray-400">Nome</th>
                  <th className="text-left p-4 text-gray-400">Ruolo</th>
                  <th className="text-left p-4 text-gray-400">Stato</th>
                  <th className="text-left p-4 text-gray-400">Abbonamento</th>
                  <th className="text-left p-4 text-gray-400">Ultimo Accesso</th>
                  <th className="text-left p-4 text-gray-400">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-700 hover:bg-gray-700/50"
                  >
                    <td className="p-4 text-white">{user.email}</td>
                    <td className="p-4 text-white">{user.displayName || '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Utente'}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.status}
                        onChange={(e) => handleUpdateUserStatus(user.id, e.target.value as UserData['status'])}
                        className={`px-3 py-1 rounded text-sm ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : user.status === 'suspended'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        <option value="active">Attivo</option>
                        <option value="suspended">Sospeso</option>
                        <option value="pending">In attesa</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {user.subscription ? (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.subscription.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.subscription.status === 'active'
                            ? `${user.subscription.plan} (attivo)`
                            : 'Scaduto'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleActivateSubscription(user.id, user.email)}
                          disabled={activatingSubscription}
                          className="flex items-center gap-2 px-3 py-1 bg-[--theater-gold] text-black rounded-full text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50"
                        >
                          {activatingSubscription ? (
                            <span className="animate-spin">⌛</span>
                          ) : (
                            <UserPlus size={14} />
                          )}
                          Attiva
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">
                      {user.lastLoginAt?.toLocaleDateString() || 'Mai'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-[--theater-gold] hover:bg-[--theater-gold]/10 rounded-full transition-colors"
                      >
                        <UserPlus size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;