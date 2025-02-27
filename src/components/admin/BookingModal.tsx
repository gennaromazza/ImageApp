import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { motion } from 'framer-motion';
import {
  X, Check, Mail, Phone, Calendar, Clock, Tag,
  MessageSquare, AlertCircle, History, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus as BaseBookingStatus } from '../../types/settings';
import { useBookingStatus } from '../../contexts/BookingStatusContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordStatusChange } from '../../lib/bookingStatus';

/**
 * Stile personalizzato per Quill
 * (colore testo bianco, sfondo scuro toolbar, ecc.)
 */
const quillCustomStyle = `
  .ql-editor {
    color: #ffffff !important; /* Testo bianco */
    min-height: 150px;         /* Altezza minima editor */
  }
  .ql-editor a {
    color: #63b3ed !important; /* Link color */
  }
  .ql-toolbar.ql-snow {
    background-color: #2d3748;  /* Sfondo scuro toolbar */
    border: 1px solid #4a5568;
  }
  .ql-toolbar .ql-stroke {
    stroke: #cbd5e1;            /* Icone toolbar più chiare */
  }
  .ql-toolbar .ql-picker-label:hover .ql-stroke,
  .ql-toolbar button:hover .ql-stroke {
    stroke: #ffffff;
  }
  /* Stili responsivi per l'editor */
  @media (max-width: 640px) {
    .ql-toolbar.ql-snow {
      flex-wrap: wrap;
      padding: 4px;
    }
    .ql-toolbar.ql-snow .ql-formats {
      margin-right: 4px;
    }
    .ql-editor {
      min-height: 120px;
    }
  }
`;

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

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'link'
];

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

  // Modal separato per la cronologia
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Toggle per mostrare/nascondere l'editor delle note
  const [showNotes, setShowNotes] = useState(false);

  /**
   * Costruisce il messaggio WhatsApp in base allo stato selezionato
   */
  const buildWhatsAppMessage = (): string => {
    const customerName = editedBooking.firstName || booking.firstName;
    const newStatusId = editedBooking.status || booking.status;
    const newStatus = bookingStatuses.find((s) => s.id === newStatusId);
    let messageTemplate = newStatus?.whatsappTemplate;
    if (!messageTemplate || messageTemplate.trim() === '') {
      messageTemplate =
        "Ciao [Nome], In merito al tuo ordine, c'è un progresso nello stato della lavorazione adesso è nello stato di [Stato].";
    }
    return messageTemplate
      .replace('[Nome]', customerName)
      .replace('[Stato]', newStatus ? newStatus.name : newStatusId);
  };

  /**
   * Salva le modifiche su Firebase, aggiungendo la nota precedente a notesHistory
   * se le note sono cambiate.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      const updateData: any = {
        ...editedBooking,
        updated_at: new Date().toISOString()
      };

      // Se la nota è cambiata, aggiungiamo la precedente allo storico
      const notesChanged = editedBooking.notes !== booking.notes;
      if (notesChanged) {
        const prevNote = booking.notes || '';
        const newHistoryEntry = {
          content: prevNote,
          timestamp: new Date().toISOString()
        };
        updateData.notes = editedBooking.notes;
        updateData.notesHistory = arrayUnion(newHistoryEntry);
      }

      // Rimuove i campi undefined
      Object.keys(updateData).forEach((key: string) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Se lo stato è cambiato, usiamo recordStatusChange
      if (editedBooking.status && editedBooking.status !== booking.status) {
        const { status, ...otherData } = updateData;
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
        // Altrimenti aggiorniamo normalmente
        await updateDoc(bookingRef, updateData);
        setSuccess(true);
        setTimeout(() => onSave(), 1500);
      }
    } catch (err: any) {
      console.error('Error updating booking:', err);
      setError('Errore durante l\'aggiornamento della prenotazione');
      setSaving(false);
    }
  };

  /**
   * Gestione conferma/cancellazione invio WhatsApp
   */
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
      {/* Stile personalizzato per Quill */}
      <style>{quillCustomStyle}</style>

      {/* Modal Principale (Modifica Prenotazione) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-gray-800 rounded-lg p-3 sm:p-6 w-full max-w-2xl relative my-2 sm:my-0"
        >
          {/* Pulsante chiusura */}
          <button
            onClick={onClose}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <X size={24} />
          </button>

          {/* Titolo */}
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6 pr-8 flex items-center gap-2">
            <Tag className="text-[--theater-gold]" />
            Modifica Prenotazione
          </h2>

          {/* Errori */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Messaggio Successo */}
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
              <Check size={18} />
              Prenotazione aggiornata con successo!
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Righe responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Data
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="GG/MM/AAAA"
                    value={editedBooking.booking_date || booking.booking_date}
                    onChange={(e) => onChange({ booking_date: e.target.value })}
                    className="w-full pl-8 sm:pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Ora
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={editedBooking.booking_time || booking.booking_time}
                    onChange={(e) => onChange({ booking_time: e.target.value })}
                    className="w-full pl-8 sm:pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Nome
                </label>
                <input
                  type="text"
                  value={editedBooking.firstName || booking.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  placeholder="Nome"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Cognome
                </label>
                <input
                  type="text"
                  value={editedBooking.lastName || booking.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  placeholder="Cognome"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={editedBooking.email || booking.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    className="w-full pl-8 sm:pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Telefono
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    value={editedBooking.phone || booking.phone}
                    onChange={(e) => onChange({ phone: e.target.value })}
                    className="w-full pl-8 sm:pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Servizio
                </label>
                <select
                  value={editedBooking.service_type || booking.service_type}
                  onChange={(e) => onChange({ service_type: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                >
                  {serviceTypes
                    .filter((service) => service.enabled)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">
                  Stato
                </label>
                <select
                  value={editedBooking.status || booking.status}
                  onChange={(e) => onChange({ status: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base"
                >
                  {statuses
                    .filter((status) => status.enabled)
                    .map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Sezione Note e Cronologia */}
            <div className="mt-4 flex items-center justify-between">
              {/* Etichetta "Note" con icona */}
              <div className="flex items-center gap-2">
                <MessageSquare className="text-gray-400" size={18} />
                <span className="text-gray-300 text-sm sm:text-base">Note</span>
              </div>

              {/* Pulsanti: Cronologia e Mostra/Chiudi Note */}
              <div className="flex gap-2">
                {/* Pulsante Cronologia (compare solo se c'è storico) */}
                {booking.notesHistory && booking.notesHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="flex items-center gap-1 sm:gap-2 bg-gray-700 text-white 
                               px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base 
                               hover:bg-gray-600 transition-colors"
                  >
                    <History size={16} />
                    Vedi Cronologia
                  </button>
                )}

                {/* Pulsante Mostra/Chiudi Note */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1 sm:gap-2 bg-gray-700 text-white 
                             px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base 
                             hover:bg-gray-600 transition-colors"
                >
                  {showNotes ? (
                    <>
                      <ChevronUp size={16} />
                      Chiudi Note
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Mostra Note
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editor delle Note (collassabile) */}
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="overflow-hidden mt-3 sm:mt-4"
              >
                <ReactQuill
                  theme="snow"
                  value={editedBooking.notes || booking.notes || ''}
                  onChange={(value) => onChange({ notes: value })}
                  modules={modules}
                  formats={formats}
                  className="bg-gray-700 text-white rounded-lg border border-gray-600"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowNotes(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white 
                               rounded hover:bg-green-700 transition-colors 
                               text-sm sm:text-base"
                  >
                    Salva Note
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex justify-end gap-2 sm:gap-4 mt-4 sm:mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 text-white 
                           rounded hover:bg-gray-600 transition-colors 
                           text-sm sm:text-base"
                disabled={saving}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 
                           bg-[--theater-gold] text-black rounded hover:bg-yellow-500 
                           transition-colors disabled:opacity-50 
                           text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Modal per la conferma dell'invio WhatsApp */}
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
            className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm mx-2"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Invia WhatsApp
            </h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Vuoi mandare un messaggio WhatsApp al cliente per l'aggiornamento dello stato?
            </p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                onClick={handleWhatsAppCancel}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 text-white 
                           rounded hover:bg-gray-600 text-sm sm:text-base"
              >
                No
              </button>
              <button
                onClick={handleWhatsAppConfirm}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white 
                           rounded hover:bg-green-700 text-sm sm:text-base"
              >
                Sì
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal Separato per la Cronologia Note */}
      {showHistoryModal && booking.notesHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-gray-800 rounded-lg p-3 sm:p-6 w-full max-w-xs sm:max-w-2xl h-auto relative mx-2 my-2 sm:my-0"
          >
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 
                         hover:text-white transition-colors"
              aria-label="Chiudi"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4 pr-8 flex items-center gap-2">
              <History className="text-[--theater-gold]" />
              Cronologia Note
            </h3>
            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
              {[...booking.notesHistory].reverse().map((entry, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="text-xs sm:text-sm text-gray-400 mb-2">
                    {new Date(entry.timestamp).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div
                    className="prose prose-invert text-gray-300 text-sm sm:text-base max-w-full"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 text-white 
                           rounded hover:bg-gray-600 transition-colors 
                           text-sm sm:text-base"
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default BookingModal;
