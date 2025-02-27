import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Ban, X, Check, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ServiceType } from '../../types/settings';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ServiceTypesProps {
  serviceTypes: ServiceType[];
  newServiceType: ServiceType;
  onServiceTypeChange: (index: number, field: keyof ServiceType, value: any) => void;
  onNewServiceTypeChange: (serviceType: ServiceType) => void;
  onAddServiceType: () => void;
  onRemoveServiceType: (index: number) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' }
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minuti' },
  { value: 30, label: '30 minuti' },
  { value: 45, label: '45 minuti' },
  { value: 60, label: '1 ora' },
  { value: 90, label: '1 ora e 30 minuti' },
  { value: 120, label: '2 ore' }
];

const ServiceTypes: React.FC<ServiceTypesProps> = ({
  serviceTypes,
  newServiceType,
  onServiceTypeChange,
  onNewServiceTypeChange,
  onAddServiceType,
  onRemoveServiceType
}) => {
  const [showExcludedDates, setShowExcludedDates] = useState<string | null>(null);
  const [newExcludedDate, setNewExcludedDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExcludedDayToggle = (index: number, dayValue: number) => {
    const service = serviceTypes[index];
    const excludedDays = service.excludedDays || [];
    const numericExcludedDays = excludedDays.map(Number);
    const dayIndex = numericExcludedDays.indexOf(dayValue);
    const newExcludedDays = dayIndex >= 0
      ? numericExcludedDays.filter(d => d !== dayValue)
      : [...numericExcludedDays, dayValue];
    newExcludedDays.sort((a, b) => a - b);
    onServiceTypeChange(index, 'excludedDays', newExcludedDays);
  };

  const handleAddExcludedDate = (index: number) => {
    if (!newExcludedDate) {
      setError('Seleziona una data da escludere');
      return;
    }

    const service = serviceTypes[index];
    
    if (service.bookingStartDate && service.bookingEndDate) {
      const date = new Date(newExcludedDate);
      const startDate = new Date(service.bookingStartDate);
      const endDate = new Date(service.bookingEndDate);
      
      if (date < startDate || date > endDate) {
        setError('La data deve essere compresa nel periodo di prenotazione');
        return;
      }
    }

    if (service.excludedDates?.includes(newExcludedDate)) {
      setError('Questa data è già stata esclusa');
      return;
    }

    const excludedDates = [...(service.excludedDates || []), newExcludedDate].sort();
    onServiceTypeChange(index, 'excludedDates', excludedDates);
    setNewExcludedDate('');
    setShowExcludedDates(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Tipi di Servizio</h4>
      
      <div className="space-y-4">
        {serviceTypes.map((service, index) => (
          <motion.div
            key={service.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-700 p-4 rounded-lg space-y-4"
          >
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={service.name}
                onChange={(e) => onServiceTypeChange(index, 'name', e.target.value)}
                className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                placeholder="Nome servizio"
              />
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={service.enabled}
                  onChange={(e) => onServiceTypeChange(index, 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                Attivo
              </label>
              <button
                type="button"
                onClick={() => onRemoveServiceType(index)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Clock size={16} />
                Durata Servizio
              </label>
              <select
                value={service.duration || 30}
                onChange={(e) => onServiceTypeChange(index, 'duration', parseInt(e.target.value))}
                className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
              >
                {DURATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <Calendar size={16} />
                  Data Inizio Prenotazioni
                </label>
                <input
                  type="date"
                  value={service.bookingStartDate || ''}
                  onChange={(e) => onServiceTypeChange(index, 'bookingStartDate', e.target.value)}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-gray-300 mb-2">
                  <Calendar size={16} />
                  Data Fine Prenotazioni
                </label>
                <input
                  type="date"
                  value={service.bookingEndDate || ''}
                  onChange={(e) => onServiceTypeChange(index, 'bookingEndDate', e.target.value)}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Ban size={16} />
                Giorni della Settimana Esclusi
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <motion.button
                    key={day.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExcludedDayToggle(index, day.value)}
                    className={`
                      px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors
                      ${(service.excludedDays || []).includes(day.value)
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }
                    `}
                  >
                    {(service.excludedDays || []).includes(day.value) && (
                      <Ban size={14} className="text-red-400" />
                    )}
                    {day.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Ban size={16} />
                Date Specifiche Escluse
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {(service.excludedDates || []).map(date => (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
                      >
                        <Ban size={14} />
                        {format(new Date(date), 'dd MMM yyyy', { locale: it })}
                        <button
                          type="button"
                          onClick={() => {
                            const excludedDates = (service.excludedDates || []).filter(d => d !== date);
                            onServiceTypeChange(index, 'excludedDates', excludedDates);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-red-400 text-sm mt-2"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {showExcludedDates === service.id ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2"
                  >
                    <input
                      type="date"
                      value={newExcludedDate}
                      onChange={(e) => {
                        setNewExcludedDate(e.target.value);
                        setError(null);
                      }}
                      className="flex-1 p-2 bg-gray-600 border border-gray-500 rounded text-white"
                      min={service.bookingStartDate}
                      max={service.bookingEndDate}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddExcludedDate(index)}
                      className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
                    >
                      <Check size={16} />
                      Aggiungi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExcludedDates(null);
                        setNewExcludedDate('');
                        setError(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                      <X size={16} />
                      Annulla
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => setShowExcludedDates(service.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm text-[--theater-gold] hover:text-yellow-500"
                  >
                    <Plus size={14} />
                    Aggiungi data esclusa
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={newServiceType.name}
          onChange={(e) => onNewServiceTypeChange({ ...newServiceType, name: e.target.value })}
          placeholder="Nuovo tipo di servizio"
          className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
        <motion.button
          type="button"
          onClick={onAddServiceType}
          disabled={!newServiceType.name}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Aggiungi
        </motion.button>
      </div>
    </div>
  );
};

export default ServiceTypes;