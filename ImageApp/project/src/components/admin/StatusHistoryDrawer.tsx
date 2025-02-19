import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useStatusHistory } from '../../hooks/useStatusHistory';
import StatusHistory from '../StatusHistory';

interface StatusHistoryDrawerProps {
  bookingId: string;
  onClose: () => void;
}

const StatusHistoryDrawer: React.FC<StatusHistoryDrawerProps> = ({
  bookingId,
  onClose
}) => {
  const { history, loading, error } = useStatusHistory(bookingId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        className="absolute right-0 top-0 h-full w-full max-w-xl bg-gray-900 shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Storico Stati</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin text-[--theater-gold]">⌛</div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <StatusHistory history={history} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StatusHistoryDrawer;