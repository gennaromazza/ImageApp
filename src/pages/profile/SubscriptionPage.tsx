import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import SubscriptionStatus from '../../components/profile/SubscriptionStatus';

const SubscriptionPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="text-[--theater-gold]" />
          Abbonamento
        </h2>

        <SubscriptionStatus />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Storico Fatturazione
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400">Data</th>
                <th className="text-left py-3 text-gray-400">Importo</th>
                <th className="text-left py-3 text-gray-400">Stato</th>
                <th className="text-left py-3 text-gray-400">Fattura</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="py-3 text-white">01/01/2024</td>
                <td className="py-3 text-white">€20.00</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    Pagato
                  </span>
                </td>
                <td className="py-3">
                  <button className="text-[--theater-gold] hover:underline">
                    Scarica PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionPage;