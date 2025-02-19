import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Mail, Phone, Calendar, Clock, Tag, MessageSquare, AlertCircle } from 'lucide-react';
import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus as BaseBookingStatus } from '../../types/settings';
import { useBookingStatus } from '../../contexts/BookingStatusContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordStatusChange } from '../../lib/bookingStatus';

// Estendiamo il tipo BookingStatus per includere whatsappTemplate
interface BookingStatus extends BaseBookingStatus {
  whatsappTemplate?: string;
}

interface BookingModalProps {
  booking: Booking;
  editedBooking: Partial<Booking>;
  serviceTypes: ServiceType[];
  bookingStatuses: BookingStatus[];
  onClose: () => void;
  onSave: () => void;
  onChange: (changes: Partial<Booking>) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  booking,
  editedBooking,
  serviceTypes,
  bookingStatuses,
  onClose,
  onSave,
  onChange,
}) => {
  const { statuses } = useBookingStatus();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);

  // Funzione per costruire il messaggio WhatsApp
  const buildWhatsAppMessage = (): string => {
    const customerName = editedBooking.firstName || booking.firstName;
    const newStatusId = editedBooking.status || booking.status;
    const newStatus = bookingStatuses.find((s) => s.id === newStatusId);
    let messageTemplate = newStatus?.whatsappTemplate;
    if (!messageTemplate || messageTemplate.trim() === '') {
      messageTemplate =
        "Ciao [Nome], In merito al tuo ordine, c'è un progresso nello stato della lavorazione adesso è nello stato di [Stato].";
    }
    messageTemplate = messageTemplate
      .replace('[Nome]', customerName)
      .replace('[Stato]', newStatus ? newStatus.name : newStatusId);
    return messageTemplate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      const updateData = {
        ...editedBooking,
        updated_at: new Date().toISOString()
      };

      // Rimuove eventuali valori undefined (con cast ad any per evitare errori di indicizzazione)
      Object.keys(updateData).forEach((key: string) => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });

      // Se lo stato è cambiato, utilizza recordStatusChange
      if (editedBooking.status && editedBooking.status !== booking.status) {
        const { status, notes, ...otherData } = updateData;
        if (Object.keys(otherData).length > 0) {
          await updateDoc(bookingRef, otherData);
        }
        await recordStatusChange(
          booking.id,
          booking.status,
          editedBooking.status,
          editedBooking.notes || ''
        );
        setShowWhatsAppConfirm(true);
      } else {
        await updateDoc(bookingRef, updateData);
        setSuccess(true);
        setTimeout(() => {
          onSave();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error updating booking:', err);
      setError('Errore durante l\'aggiornamento della prenotazione');
      setSaving(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    const message = buildWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowWhatsAppConfirm(false);
    onSave();
  };

  const handleWhatsAppCancel = () => {
    setShowWhatsAppConfirm(false);
    onSave();
  };

  return (
    <>
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
          className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Tag className="text-[--theater-gold]" />
            Modifica Prenotazione
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-2">
              <Check size={20} />
              Prenotazione aggiornata con successo!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    value={editedBooking.booking_date || booking.booking_date}
                    onChange={(e) => onChange({ booking_date: e.target.value })}
                    className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Ora</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="time"
                    value={editedBooking.booking_time || booking.booking_time}
                    onChange={(e) => onChange({ booking_time: e.target.value })}
                    className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={editedBooking.firstName || booking.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Nome"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Cognome</label>
                <input
                  type="text"
                  value={editedBooking.lastName || booking.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Cognome"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={editedBooking.email || booking.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Telefono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={editedBooking.phone || booking.phone}
                    onChange={(e) => onChange({ phone: e.target.value })}
                    className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Servizio</label>
                <select
                  value={editedBooking.service_type || booking.service_type}
                  onChange={(e) => onChange({ service_type: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  {serviceTypes
                    .filter(service => service.enabled)
                    .map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Stato</label>
                <select
                  value={editedBooking.status || booking.status}
                  onChange={(e) => onChange({ status: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  {statuses
                    .filter(status => status.enabled)
                    .map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Note</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  value={editedBooking.notes || booking.notes || ''}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={saving}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Modale per conferma invio messaggio WhatsApp */}
      {showWhatsAppConfirm && (
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
            className="bg-gray-800 rounded-lg p-6 w-full max-w-sm"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Invia WhatsApp</h3>
            <p className="text-gray-300 mb-6">
              Vuoi mandare un messaggio WhatsApp al cliente per l'aggiornamento dello stato?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleWhatsAppCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                No
              </button>
              <button
                onClick={handleWhatsAppConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Sì
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default BookingModal;
