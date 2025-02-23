import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import BookingRow from './BookingRow';
import BookingModal from './BookingModal';
import OrderManager from '../OrderManager';
import StatusModal from './StatusModal';
import Toast from './Toast';
import NotifyAppWhtz from './NotifyAppWhtz';
import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus } from '../../types/settings';

interface BookingTableProps {
  bookings: Booking[];
  serviceTypes: ServiceType[];
  bookingStatuses: BookingStatus[];
  getServiceLabel: (service: string) => string;
  getStatusColor: (status: string) => string;
}

const INITIAL_ITEMS = 10; // Quante prenotazioni mostriamo inizialmente
const INCREMENT_ITEMS = 10; // Quante prenotazioni aggiungiamo ad ogni "Load More"

type FilterType = 'today' | 'tomorrow' | 'week' | 'all';

const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  serviceTypes,
  bookingStatuses,
  getServiceLabel,
  getStatusColor,
}) => {
  // Stati interni
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editedBooking, setEditedBooking] = useState<Partial<Booking>>({});
  const [error, setError] = useState<string | null>(null);

  // Numero di elementi mostrati
  const [itemsToShow, setItemsToShow] = useState(INITIAL_ITEMS);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newBookings, setNewBookings] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Calcolo status e conteggi
  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== 'completed' && b.status !== 'canceled'),
    [bookings]
  );

  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
  }, [bookings]);

  // Simulazione arrivo nuove prenotazioni
  useEffect(() => {
    if (bookings.length > 0) {
      const latestBookingId = bookings[bookings.length - 1].id;
      setNewBookings((prev) =>
        prev.includes(latestBookingId) ? prev : [...prev, latestBookingId]
      );
    }
  }, [bookings]);

  // Date per filtri
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrowDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const yyyyT = tomorrowDate.getFullYear();
  const mmT = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const ddT = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrowStr = `${yyyyT}-${mmT}-${ddT}`;

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const weekLimit = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekLimitStr = formatDate(weekLimit);

  // Filtra le prenotazioni in base al filtro selezionato
  const filteredBookings = useMemo(() => {
    if (filterType === 'today') {
      return bookings.filter((b) => b.booking_date === todayStr);
    } else if (filterType === 'tomorrow') {
      return bookings.filter((b) => b.booking_date === tomorrowStr);
    } else if (filterType === 'week') {
      return bookings.filter(
        (b) => b.booking_date >= todayStr && b.booking_date <= weekLimitStr
      );
    }
    return bookings;
  }, [bookings, filterType, todayStr, tomorrowStr, weekLimitStr]);

  // Ordina le prenotazioni filtrate
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateComparison = a.booking_date.localeCompare(b.booking_date);
      if (dateComparison !== 0) return dateComparison;
      return a.booking_time.localeCompare(b.booking_time);
    });
  }, [filteredBookings]);

  // Mostra solo i primi itemsToShow
  const displayedBookings = sortedBookings.slice(0, itemsToShow);

  // Handlers per azioni su prenotazioni
  const handleRowClick = (bookingId: string) => {
    setSelectedBooking((prev) => (prev === bookingId ? null : bookingId));
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditedBooking({ ...booking });
  };

  const handleSave = async () => {
    if (!editingBooking) return;
    try {
      const bookingRef = doc(db, 'bookings', editingBooking.id);
      await updateDoc(bookingRef, {
        ...editedBooking,
        updated_at: new Date().toISOString(),
      });
      setEditingBooking(null);
      setEditedBooking({});
    } catch (err) {
      console.error('Error saving booking:', err);
      setError('Errore durante il salvataggio della prenotazione');
    }
  };
  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) return;
    try {
      setError(null);
      await deleteDoc(doc(db, 'bookings', bookingId));
      if (selectedBooking === bookingId) {
        setSelectedBooking(null);
      }
      if (editingBooking?.id === bookingId) {
        setEditingBooking(null);
        setEditedBooking({});
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError("Errore durante l'eliminazione della prenotazione");
    }
  };

  const handleCancel = () => {
    setEditingBooking(null);
    setEditedBooking({});
  };

  // Load More: aumenta il numero di elementi da mostrare
  const handleLoadMore = () => {
    setItemsToShow((prev) => prev + INCREMENT_ITEMS);
  };

  // Quando cambio filtro, resetto la quantità di elementi
  useEffect(() => {
    setItemsToShow(INITIAL_ITEMS);
  }, [filterType]);

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden w-full relative">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg text-white font-semibold">Gestione Prenotazioni</h2>
        <div className="flex items-center gap-4">
          <p className="text-gray-400 text-sm">
            Prenotazioni attive: <span className="text-white">{activeBookings.length}</span>{' '}
            / Totali: <span className="text-white">{bookings.length}</span>
          </p>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Dettagli Stati
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="px-4 pb-2 flex flex-wrap gap-2 border-b border-gray-700">
        {(['today', 'tomorrow', 'week', 'all'] as FilterType[]).map((ft) => {
          const label =
            ft === 'today' ? 'Oggi' :
            ft === 'tomorrow' ? 'Domani' :
            ft === 'week' ? 'Settimana' : 'Tutte';

          return (
            <motion.button
              key={ft}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1 rounded ${
                filterType === ft ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setFilterType(ft)}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Eventuali errori */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mx-4 rounded-lg mt-2">
          {error}
        </div>
      )}

      {/* Tabella */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-4 text-left text-gray-300">Data e Ora</th>
              <th className="p-4 text-left text-gray-300">Cliente</th>
              <th className="p-4 text-left text-gray-300">Contatti</th>
              <th className="p-4 text-left text-gray-300">Servizio</th>
              <th className="p-4 text-left text-gray-300">Ticket</th>
              <th className="p-4 text-left text-gray-300">Stato</th>
              <th className="p-4 text-left text-gray-300">Note</th>
              <th className="p-4 text-left text-gray-300">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {displayedBookings.map((booking) => (
              <React.Fragment key={booking.id}>
                <BookingRow
                  booking={booking}
                  onEdit={() => handleEdit(booking)}
                  onDelete={() => handleDelete(booking.id)}
                  getServiceLabel={getServiceLabel}
                  getStatusColor={getStatusColor}
                  onClick={() => handleRowClick(booking.id)}
                  isSelected={selectedBooking === booking.id}
                  className={
                    newBookings.includes(booking.id)
                      ? 'animate-pulse bg-green-700'
                      : ''
                  }
                />
                {/* Se l'utente clicca sulla riga, mostro l'espansione con OrderManager */}
                {selectedBooking === booking.id && (
                  <tr>
                    <td colSpan={8} className="p-4 bg-gray-700/30">
                      <OrderManager bookingId={booking.id} booking={booking} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {displayedBookings.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-6">
                  Nessuna prenotazione trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottone "Carica Altri" se abbiamo altre prenotazioni da mostrare */}
      {displayedBookings.length < sortedBookings.length && (
        <div className="p-4 flex justify-center border-t border-gray-700">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Carica Altri
          </button>
        </div>
      )}

      {/* Modale di modifica */}
      <AnimatePresence>
        {editingBooking && (
          <BookingModal
            booking={editingBooking}
            editedBooking={editedBooking}
            serviceTypes={serviceTypes}
            bookingStatuses={bookingStatuses}
            onClose={handleCancel}
            onSave={handleSave}
            onChange={setEditedBooking}
          />
        )}
      </AnimatePresence>

      {/* Modale stati */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusCounts={statusCounts}
        bookingStatuses={bookingStatuses}
        getStatusColor={getStatusColor}
        totalBookings={bookings.length}
        activeBookings={activeBookings.length}
      />

      {/* Toast per nuove prenotazioni */}
      {newBookings.length > 0 && <Toast message="Nuova prenotazione ricevuta!" />}
    </div>
  );
};

export default BookingTable;
