import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import BookingRow from './BookingRow';
import BookingModal from './BookingModal';
import OrderManager from '../OrderManager';
import StatusModal from './StatusModal';
import Toast_New_Booking from './Toast_New_Booking';
import { format } from 'date-fns'; // <-- Import per formattare date
import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus } from '../../types/settings';

interface BookingTableProps {
  bookings: Booking[];
  serviceTypes: ServiceType[];
  bookingStatuses: BookingStatus[];
  getServiceLabel: (service: string) => string;
  getStatusColor: (status: string) => string;
}

const INITIAL_ITEMS = 10;
const INCREMENT_ITEMS = 10;

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

  // Paginazione
  const [itemsToShow, setItemsToShow] = useState(INITIAL_ITEMS);

  // Stato per la modale degli stati
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Toast per nuove prenotazioni
  const [newBookings, setNewBookings] = useState<Booking[]>([]);

  // Stato per evidenziare una prenotazione (feedback visivo)
  const [highlightedBooking, setHighlightedBooking] = useState<string | null>(null);

  // Filtro per data
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Calcolo prenotazioni attive
  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== 'completed' && b.status !== 'canceled'),
    [bookings]
  );

  // Conteggio degli stati
  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
  }, [bookings]);

  // Controlla se una prenotazione è già stata dismessa (persistenza via localStorage)
  function wasDismissed(bookingId: string) {
    return localStorage.getItem(`dismissed-booking-${bookingId}`) === 'true';
  }

  // Aggiungi nuova prenotazione ai toast (se non già dismessa)
  useEffect(() => {
    if (bookings.length > 0) {
      const latestBooking = bookings[bookings.length - 1];
      if (!wasDismissed(latestBooking.id)) {
        setNewBookings((prev) =>
          prev.some((b) => b.id === latestBooking.id) ? prev : [...prev, latestBooking]
        );
      }
    }
  }, [bookings]);

  // Filtraggio in base alla data
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

  // Ordinamento
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateComparison = a.booking_date.localeCompare(b.booking_date);
      if (dateComparison !== 0) return dateComparison;
      return a.booking_time.localeCompare(b.booking_time);
    });
  }, [filteredBookings]);

  // Paginazione
  const displayedBookings = sortedBookings.slice(0, itemsToShow);

  // Funzione per assicurarsi che la prenotazione sia visibile e poi scrollare
  const showBookingRow = (bookingId: string) => {
    const index = sortedBookings.findIndex((b) => b.id === bookingId);
    if (index === -1) return;

    if (index >= itemsToShow) {
      let needed = itemsToShow;
      while (needed <= index) {
        needed += INCREMENT_ITEMS;
      }
      setItemsToShow(needed);

      setTimeout(() => {
        const element = document.getElementById(`booking-${bookingId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    } else {
      const element = document.getElementById(`booking-${bookingId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Gestione click sul toast: rimuove toast, salva in localStorage e scrolla con feedback visivo
  const handleToastClick = (booking: Booking) => {
    setNewBookings((prev) => prev.filter((b) => b.id !== booking.id));
    localStorage.setItem(`dismissed-booking-${booking.id}`, 'true');
    showBookingRow(booking.id);
    setHighlightedBooking(booking.id);
    setTimeout(() => {
      setHighlightedBooking(null);
    }, 2000);
  };

  // Per clic su card dello slider ultime 5
  const handleLastBookingClick = (bookingId: string) => {
    showBookingRow(bookingId);
    setHighlightedBooking(bookingId);
    setTimeout(() => {
      setHighlightedBooking(null);
    }, 2000);
  };

  // Ultime 5 prenotazioni (in ordine dal più recente)
  const lastFive = useMemo(() => {
    if (sortedBookings.length === 0) return [];
    return [...sortedBookings].slice(-5).reverse();
  }, [sortedBookings]);

  // Handlers per azioni sulle righe
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

  const handleLoadMore = () => {
    setItemsToShow((prev) => prev + INCREMENT_ITEMS);
  };

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
            className="w-32 whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
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
            ft === 'today'
              ? 'Oggi'
              : ft === 'tomorrow'
              ? 'Domani'
              : ft === 'week'
              ? 'Settimana'
              : 'Tutte';
          return (
            <motion.button
              key={ft}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-32 whitespace-nowrap truncate px-3 py-1 rounded ${
                filterType === ft ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setFilterType(ft)}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Slider Ultime 5 Prenotazioni */}
      {lastFive.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-white font-semibold mb-2">Ultime 5 Prenotazioni</h3>
          <div className="overflow-x-auto flex gap-4">
            {lastFive.map((b) => (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.02 }}
                className="min-w-[200px] bg-gray-700 p-3 rounded cursor-pointer"
                onClick={() => handleLastBookingClick(b.id)}
              >
                <div className="text-sm text-white font-medium">
                  {b.firstName} {b.lastName}
                </div>
                <div className="text-xs text-gray-400">
                  {b.booking_date} {b.booking_time}
                </div>
                <div className="text-xs text-gray-400">
                  Ricevuta il{' '}
                  {b.created_at?.toDate
                    ? format(b.created_at.toDate(), 'dd/MM/yyyy HH:mm')
                    : 'N/A'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
                  rowId={`booking-${booking.id}`} // Per lo scroll
                  onEdit={() => handleEdit(booking)}
                  onDelete={() => handleDelete(booking.id)}
                  getServiceLabel={getServiceLabel}
                  getStatusColor={getStatusColor}
                  onClick={() => handleRowClick(booking.id)}
                  isSelected={selectedBooking === booking.id}
                  className={
                    newBookings.some((b) => b.id === booking.id)
                      ? 'animate-pulse bg-green-700'
                      : highlightedBooking === booking.id
                      ? 'bg-green-500'
                      : ''
                  }
                />
                {/* Riga aggiuntiva: data di creazione in piccolo */}
                <tr>
                  <td colSpan={8} className="text-xs text-gray-400 px-4 pb-2">
                    Prenotazione ricevuta il{' '}
                    {booking.created_at?.toDate
                      ? format(booking.created_at.toDate(), 'dd/MM/yyyy HH:mm')
                      : 'N/A'}
                  </td>
                </tr>

                {/* Espansione OrderManager */}
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

      {/* Bottone "Carica Altri" */}
      {displayedBookings.length < sortedBookings.length && (
        <div className="p-4 flex justify-center border-t border-gray-700">
          <button
            onClick={handleLoadMore}
            className="w-32 whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
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

      {/* Toast invasivo per nuove prenotazioni */}
      {newBookings.map((booking) => (
        <Toast_New_Booking
          key={booking.id}
          booking={booking}
          onDismiss={handleToastClick}
        />
      ))}
    </div>
  );
};

export default BookingTable;
