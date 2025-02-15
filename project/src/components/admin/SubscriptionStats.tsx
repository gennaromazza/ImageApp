import React from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, TrendingUp, Clock } from 'lucide-react';
import type { Subscription } from '../../lib/subscription';

interface SubscriptionStatsProps {
  subscriptions: Subscription[];
}

const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({ subscriptions }) => {
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expiringSoon: subscriptions.filter(s => {
      const daysUntilExpiry = Math.ceil((s.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return s.status === 'active' && daysUntilExpiry <= 7;
    }).length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'active' && s.plan === 'monthly')
      .length * 20 + 
      subscriptions
      .filter(s => s.status === 'active' && s.plan === 'yearly')
      .length * (100 / 12)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-700 p-6 rounded-lg"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Totale Abbonati</h3>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-700 p-6 rounded-lg"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Abbonamenti Attivi</h3>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-700 p-6 rounded-lg"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">In Scadenza</h3>
            <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-700 p-6 rounded-lg"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[--theater-gold]/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-[--theater-gold]" />
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Ricavi Mensili</h3>
            <p className="text-2xl font-bold text-white">€{Math.round(stats.monthlyRevenue)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionStats;