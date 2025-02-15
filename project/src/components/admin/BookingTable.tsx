import { useStatusHistory } from '../../hooks/useStatusHistory';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Booking } from '../../types/booking';
import type { ServiceType, BookingStatus } from '../../types/settings';
import BookingRow from './BookingRow';
import BookingModal from './BookingModal';
import OrderManager from '../OrderManager';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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

  const handleRowClick = (bookingId: string) => {
    setSelectedBooking(selectedBooking === bookingId ? null : bookingId);
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
        updated_at: new Date().toISOString()
      });
      setEditingBooking(null);
      setEditedBooking({});
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('Errore durante il salvataggio della prenotazione');
    }
  };

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
      setError('Errore durante l\'eliminazione della prenotazione');
    }
  };

  const handleCancel = () => {
    setEditingBooking(null);
    setEditedBooking({});
  };

  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    // First compare dates
    const dateComparison = a.booking_date.localeCompare(b.booking_date);
    if (dateComparison !== 0) return dateComparison;
    
    // If dates are equal, compare times
    return a.booking_time.localeCompare(b.booking_time);
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = sortedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 m-4 rounded-lg">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
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
            {paginatedBookings.map((booking) => (
              <React.Fragment key={booking.id}>
                <BookingRow
                  booking={booking}
                  onEdit={() => handleEdit(booking)}
                  onDelete={() => handleDelete(booking.id)}
                  getServiceLabel={getServiceLabel}
                  getStatusColor={getStatusColor}
                  onClick={() => handleRowClick(booking.id)}
                  isSelected={selectedBooking === booking.id}
                />
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Precedente
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              Pagina {currentPage} di {totalPages}
            </span>
            <span className="text-gray-400">
              ({startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedBookings.length)} di {sortedBookings.length})
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Successiva
            <ChevronRight size={20} />
          </button>
        </div>
      )}

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