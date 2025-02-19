import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import BookingRow from './BookingRow';
import BookingModal from './BookingModal';
import OrderManager from '../OrderManager';

import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus } from '../../types/settings';

interface BookingTableProps {
  bookings: Booking[];
  serviceTypes: ServiceType[];
  bookingStatuses: BookingStatus[];
  getServiceLabel: (service: string) => string;
  getStatusColor: (status: string) => string;
}

const ITEMS_PER_PAGE = 10;

const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  serviceTypes,
  bookingStatuses,
  getServiceLabel,
  getStatusColor,
}) => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editedBooking, setEditedBooking] = useState<Partial<Booking>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtra prenotazioni "attive" (esempio: status != 'completed' e != 'canceled')
  const activeBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'canceled'
  );

  // Al click su una riga, apri/chiudi OrderManager
  const handleRowClick = (bookingId: string) => {
    setSelectedBooking((prev) => (prev === bookingId ? null : bookingId));
  };

  // Gestione modifica booking
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
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Errore durante il salvataggio della prenotazione');
    }
  };

  // Gestione eliminazione booking
  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      return;
    }
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
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError("Errore durante l'eliminazione della prenotazione");
    }
  };

  const handleCancel = () => {
    setEditingBooking(null);
    setEditedBooking({});
  };

  // Ordina le prenotazioni per data e ora
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateComparison = a.booking_date.localeCompare(b.booking_date);
    if (dateComparison !== 0) return dateComparison;
    return a.booking_time.localeCompare(b.booking_time);
  });

  // Paginazione
  const totalPages = Math.ceil(sortedBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = sortedBookings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden w-full">
      {/* Riepilogo prenotazioni */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg text-white font-semibold">Gestione Prenotazioni</h2>
        <p className="text-gray-400 text-sm">
          Prenotazioni attive: <span className="text-white">{activeBookings.length}</span> / Totali:{' '}
          <span className="text-white">{bookings.length}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mx-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Contenitore scroll orizzontale su schermi piccoli */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Data e Ora</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Cliente</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Contatti</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Servizio</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Ticket</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Stato</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Note</th>
              <th className="p-4 text-left text-gray-300 whitespace-nowrap">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBookings.map((booking) => (
              <React.Fragment key={booking.id}>
                {/* RIGA PRINCIPALE */}
                <BookingRow
                  booking={booking}
                  onEdit={() => handleEdit(booking)}
                  onDelete={() => handleDelete(booking.id)}
                  getServiceLabel={getServiceLabel}
                  getStatusColor={getStatusColor}
                  onClick={() => handleRowClick(booking.id)}
                  isSelected={selectedBooking === booking.id}
                />

                {/* RIGA ESPANSA: OrderManager */}
                {selectedBooking === booking.id && (
                  <tr>
                    <td colSpan={8} className="p-4 bg-gray-700/30">
                      <OrderManager bookingId={booking.id} booking={booking} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controlli di paginazione */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t border-gray-700 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Precedente
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="text-gray-400">
              Pagina {currentPage} di {totalPages}
            </span>
            <span className="text-gray-400">
              (
              {startIndex + 1}-
              {Math.min(startIndex + ITEMS_PER_PAGE, sortedBookings.length)} di{' '}
              {sortedBookings.length}
              )
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Successiva
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Modale di modifica prenotazione */}
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
    </div>
  );
};

export default BookingTable;
