import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, FileText } from 'lucide-react';
import { useBookingStatus } from '../contexts/BookingStatusContext';
import { recordStatusChange } from '../lib/bookingStatus';

interface StatusChangeModalProps {
  bookingId: string;
  currentStatusId: string;
  onClose: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  bookingId,
  currentStatusId,
  onClose
}) => {
  const { statuses, getStatusColor, getStatusName } = useBookingStatus();
  const [selectedStatusId, setSelectedStatusId] = useState(currentStatusId);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async () => {
    if (selectedStatusId === currentStatusId) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await recordStatusChange(
        bookingId,
        currentStatusId,
        selectedStatusId,
        note
      );
      onClose();
    } catch (error) {
      console.error('Error changing status:', error);
      setError('Errore durante il cambio di stato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Cambio Stato</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {statuses
              .filter(status => status.enabled)
              .map(status => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatusId(status.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${selectedStatusId === status.id
                      ? 'border-[--theater-gold] shadow-lg scale-105'
                      : 'border-transparent hover:border-gray-600'
                    }
                  `}
                  style={{
                    backgroundColor: `${status.color}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: status.color }}
                    >
                      {status.name}
                    </span>
                  </div>
                </button>
              ))}
          </div>

          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              Note (opzionale)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white resize-none"
              rows={3}
              placeholder="Aggiungi una nota per questo cambio di stato..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Annulla
            </button>
            <button
              onClick={handleStatusChange}
              disabled={saving || selectedStatusId === currentStatusId}
              className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Conferma Cambio
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StatusChangeModal;