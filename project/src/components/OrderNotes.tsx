import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText } from 'lucide-react';
import { updateOrder } from '../lib/products';
import type { Order } from '../lib/products';

interface OrderNotesProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const OrderNotes: React.FC<OrderNotesProps> = ({ order, isOpen, onClose }) => {
  const [notes, setNotes] = useState(order.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateOrder(order.id, { notes });
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Errore durante il salvataggio delle note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="text-[--theater-gold]" />
                Note Ordine
              </h3>
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

            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-48 p-4 bg-gray-700 border border-gray-600 rounded text-white resize-none"
                placeholder="Inserisci le note per questo ordine..."
              />

              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Salva Note
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderNotes;