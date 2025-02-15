import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, Save, X, AlertCircle, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSettings } from '../../hooks/useSettings';
import { createBooking } from '../../lib/booking';
import TimeSlotPicker from './TimeSlotPicker';

const bookingSchema = z.object({
  firstName: z.string().min(2, 'Nome richiesto'),
  lastName: z.string().min(2, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().min(9, 'Numero di telefono non valido').max(10, 'Numero di telefono non valido'),
  service_type: z.string().min(1, 'Seleziona un tipo di servizio'),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface ManualBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ManualBookingForm: React.FC<ManualBookingFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema)
  });

  const generateTicketNumber = () => {
    return `CNC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      setError('Seleziona data e ora per la prenotazione');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        ...data,
        booking_date: selectedDate.toISOString().split('T')[0],
        booking_time: selectedTime,
        ticket_number: generateTicketNumber(),
        status: 'pending'
      };

      await createBooking(bookingData);
      reset();
      setSelectedDate(null);
      setSelectedTime('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Errore durante la creazione della prenotazione');
    } finally {
      setLoading(false);
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
            className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-[--theater-gold]" />
                Nuova Prenotazione
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Nome</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        {...register('firstName')}
                        className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="Nome"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Cognome</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        {...register('lastName')}
                        className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="Cognome"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="email@esempio.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Telefono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="Inserisci il numero senza prefisso"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Servizio</label>
                    <select
                      {...register('service_type')}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="">Seleziona servizio</option>
                      {settings?.serviceTypes
                        .filter(service => service.enabled)
                        .map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                    </select>
                    {errors.service_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.service_type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Note (opzionale)</label>
                    <textarea
                      {...register('notes')}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      rows={3}
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                {/* Data e Ora */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Data</label>
                    <input
                      type="date"
                      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>

                  {selectedDate && (
                    <TimeSlotPicker
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Creazione in corso...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Crea Prenotazione
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManualBookingForm;