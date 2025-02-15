import React, { useState } from 'react';
import { Plus, Trash2, Save, AlertCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookingStatus } from '../../types/settings';
import ColorPicker from '../ColorPicker';

interface StatusManagerProps {
  statuses: BookingStatus[];
  onSave: (statuses: BookingStatus[]) => Promise<void>;
}

const StatusManager: React.FC<StatusManagerProps> = ({ statuses: initialStatuses, onSave }) => {
  const [statuses, setStatuses] = useState<BookingStatus[]>(initialStatuses.map(status => ({
    ...status,
    enabled: status.enabled ?? true
  })));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Omit<BookingStatus, 'id'>>({
    name: '',
    color: '#4CAF50',
    enabled: true
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
        enabled: true
      });
      setError(null);
      showSuccess('Nuovo stato aggiunto con successo');
    } catch (error) {
      console.error('Error saving new status:', error);
      setError('Errore durante il salvataggio del nuovo stato');
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

      <div className="space-y-4">
        {statuses.map((status, index) => (
          <motion.div
            key={status.id}
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
              
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(showColorPicker === status.id ? null : status.id)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:scale-105 transition-transform"
                  style={{ backgroundColor: status.color }}
                />
                
                {showColorPicker === status.id && (
                  <div className="absolute right-0 top-12 z-10">
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setShowColorPicker(null)}
                    />
                    <ColorPicker
                      color={status.color}
                      onChange={(color) => handleColorChange(index, color)}
                    />
                  </div>
                )}
              </div>

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
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={newStatus.name}
          onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
          placeholder="Nuovo stato"
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-[--theater-gold] transition-colors"
        />
        
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:scale-105 transition-transform"
            style={{ backgroundColor: newStatus.color }}
          />
          
          {showColorPicker === 'new' && (
            <div className="absolute right-0 top-12 z-10">
              <div 
                className="fixed inset-0" 
                onClick={() => setShowColorPicker(null)}
              />
              <ColorPicker
                color={newStatus.color}
                onChange={(color) => setNewStatus({ ...newStatus, color })}
              />
            </div>
          )}
        </div>

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