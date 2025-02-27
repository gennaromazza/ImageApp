import React, { useState } from 'react';
import { Plus, Trash2, Settings, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import type { BookingStatus as BaseBookingStatus } from '../../types/settings';

// Estendiamo il tipo BookingStatus per includere whatsappTemplate
interface BookingStatus extends BaseBookingStatus {
  whatsappTemplate?: string;
}

interface StatusManagerProps {
  statuses: BookingStatus[];
  onSave: (statuses: BookingStatus[]) => Promise<void>;
}

const StatusManager: React.FC<StatusManagerProps> = ({ statuses: initialStatuses, onSave }) => {
  const [statuses, setStatuses] = useState<BookingStatus[]>(
    initialStatuses.map(status => ({
      ...status,
      enabled: status.enabled ?? true,
      whatsappTemplate: status.whatsappTemplate || ''
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<Omit<BookingStatus, 'id'>>({
    name: '',
    color: '#4CAF50',
    enabled: true,
    whatsappTemplate: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddStatus = async () => {
    if (!newStatus.name) {
      setError('Inserisci un nome per lo stato');
      return;
    }

    if (statuses.some(s => s.name.toLowerCase() === newStatus.name.toLowerCase())) {
      setError('Esiste già uno stato con questo nome');
      return;
    }

    const id = newStatus.name.toLowerCase().replace(/\s+/g, '_');
    const newStatusComplete: BookingStatus = {
      ...newStatus,
      id,
      enabled: true
    };

    const updatedStatuses = [...statuses, newStatusComplete];
    setStatuses(updatedStatuses);

    try {
      setSaving(true);
      await onSave(updatedStatuses);
      setNewStatus({
        name: '',
        color: '#4CAF50',
        enabled: true,
        whatsappTemplate: ''
      });
      setError(null);
      showSuccess('Nuovo stato aggiunto con successo');
    } catch (error) {
      console.error('Error saving new status:', error);
      setError('Errore durante il salvataggio del nuovo stato');
      // Ripristina lo stato precedente
      setStatuses(statuses);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (index: number, field: keyof BookingStatus, value: any) => {
    const updatedStatuses = [...statuses];
    updatedStatuses[index] = {
      ...updatedStatuses[index],
      [field]: value
    };
    setStatuses(updatedStatuses);

    try {
      setSaving(true);
      await onSave(updatedStatuses);
      showSuccess('Modifiche salvate con successo');
    } catch (error) {
      console.error('Error saving status changes:', error);
      setError('Errore durante il salvataggio delle modifiche');
      setStatuses(statuses);
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = async (index: number, color: string) => {
    await handleStatusChange(index, 'color', color);
  };

  const handleRemoveStatus = async (index: number) => {
    const updatedStatuses = statuses.filter((_, i) => i !== index);
    
    try {
      setSaving(true);
      await onSave(updatedStatuses);
      setStatuses(updatedStatuses);
      showSuccess('Stato rimosso con successo');
    } catch (error) {
      console.error('Error removing status:', error);
      setError('Errore durante la rimozione dello stato');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      await onSave(statuses);
      showSuccess('Ordine salvato con successo');
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Errore durante il salvataggio dell\'ordine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="text-[--theater-gold]" />
          Stati Prenotazione
        </h3>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Reorder.Group 
        values={statuses} 
        onReorder={setStatuses} 
        className="space-y-4"
      >
        {statuses.map((status, index) => (
          <Reorder.Item key={status.id} value={status}>
            <motion.div
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={status.name}
                  onChange={(e) => handleStatusChange(index, 'name', e.target.value)}
                  className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white focus:border-[--theater-gold] transition-colors"
                  placeholder="Nome stato"
                />
                <input
                  type="color"
                  value={status.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-600"
                />
                <label className="flex items-center gap-2 text-white hover:text-[--theater-gold] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.enabled}
                    onChange={(e) => handleStatusChange(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded accent-[--theater-gold]"
                  />
                  Attivo
                </label>
                <button
                  onClick={() => handleRemoveStatus(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                  title="Rimuovi stato"
                  disabled={saving}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="mt-2 flex flex-col">
                <input
                  type="text"
                  value={status.whatsappTemplate || ''}
                  onChange={(e) =>
                    handleStatusChange(index, 'whatsappTemplate', e.target.value)
                  }
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:border-[--theater-gold] transition-colors"
                  placeholder="Messaggio WhatsApp..."
                />
                {index === 0 && (
                  <span className="mt-1 text-xs text-blue-500 font-bold">
                    Questo stato verrà usato come default per le nuove prenotazioni.
                  </span>
                )}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="flex justify-end">
        <motion.button
          onClick={saveOrder}
          disabled={saving}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save size={20} />
          {saving ? 'Salvataggio...' : 'Salva Ordine'}
        </motion.button>
      </div>

      <div className="flex gap-4 mt-6">
        <input
          type="text"
          value={newStatus.name}
          onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
          placeholder="Nuovo stato"
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-[--theater-gold] transition-colors"
        />
        <input
          type="color"
          value={newStatus.color}
          onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
          className="w-10 h-10 rounded-lg border-2 border-gray-600"
        />
        <input
          type="text"
          value={newStatus.whatsappTemplate}
          onChange={e => setNewStatus({ ...newStatus, whatsappTemplate: e.target.value })}
          placeholder="Messaggio WhatsApp..."
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-[--theater-gold] transition-colors"
        />
        <motion.button
          onClick={handleAddStatus}
          disabled={!newStatus.name || saving}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={20} />
          {saving ? 'Aggiunta...' : 'Aggiungi'}
        </motion.button>
      </div>
    </div>
  );
};

export default StatusManager;
