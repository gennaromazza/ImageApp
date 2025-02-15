import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import type { Subscription } from '../../lib/subscription';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ExportSubscriptionsProps {
  subscriptions: Subscription[];
}

const ExportSubscriptions: React.FC<ExportSubscriptionsProps> = ({ subscriptions }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = () => {
    setLoading(true);
    setError(null);

    try {
      const headers = [
        'Email',
        'Piano',
        'Stato',
        'Data Inizio',
        'Data Scadenza',
        'Prenotazioni Usate',
        'Limite Prenotazioni'
      ];

      const rows = subscriptions.map(sub => [
        sub.email,
        sub.plan,
        sub.status,
        format(sub.startDate, 'dd/MM/yyyy', { locale: it }),
        format(sub.endDate, 'dd/MM/yyyy', { locale: it }),
        sub.bookingsUsed,
        sub.maxBookings
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `abbonamenti_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      setError('Errore durante l\'esportazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={exportToCSV}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-spin">⌛</span>
        ) : (
          <FileSpreadsheet size={20} />
        )}
        Esporta Abbonamenti
      </motion.button>
    </div>
  );
};

export default ExportSubscriptions;