import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, RefreshCw, Calendar, CreditCard, Clock, Settings } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Subscription } from '../../lib/subscription';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import SubscriptionActions from '../../components/admin/SubscriptionActions';
import SubscriptionStats from '../../components/admin/SubscriptionStats';
import ExportSubscriptions from '../../components/admin/ExportSubscriptions';

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, orderBy('endDate', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const subscriptionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : new Date()
          } as Subscription;
        });
        setSubscriptions(subscriptionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscriptions:', error);
        setError('Errore nel caricamento degli abbonamenti');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              Gestione Abbonamenti
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
                title="Aggiorna"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <SubscriptionStats subscriptions={subscriptions} />
          <ExportSubscriptions subscriptions={subscriptions} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="expired">Scaduti</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400">Email</th>
                  <th className="text-left p-4 text-gray-400">Piano</th>
                  <th className="text-left p-4 text-gray-400">Stato</th>
                  <th className="text-left p-4 text-gray-400">Scadenza</th>
                  <th className="text-left p-4 text-gray-400">Prenotazioni</th>
                  <th className="text-left p-4 text-gray-400">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <motion.tr
                    key={subscription.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-700 hover:bg-gray-700/50"
                  >
                    <td className="p-4 text-white">{subscription.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                        {subscription.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        subscription.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {subscription.status === 'active' ? 'Attivo' : 'Scaduto'}
                      </span>
                    </td>
                    <td className="p-4 text-white">
                      {format(subscription.endDate, 'dd MMM yyyy', { locale: it })}
                    </td>
                    <td className="p-4 text-white">
                      {subscription.bookingsUsed} / {subscription.maxBookings}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedSubscription(subscription)}
                        className="p-2 text-[--theater-gold] hover:bg-[--theater-gold]/10 rounded-full transition-colors"
                      >
                        <Settings size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSubscription && (
          <SubscriptionActions
            subscription={selectedSubscription}
            onClose={() => setSelectedSubscription(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionsPage;