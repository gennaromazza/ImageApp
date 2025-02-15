import React from 'react';
import { format } from 'date-fns';
import { Mail, Phone, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import type { Booking } from '../../types/booking';
import { getWhatsAppLink } from '../../utils/booking';
import { useBookingStatus } from '../../contexts/BookingStatusContext';
import NotifyAppWhtz from './NotifyAppWhtz';
interface BookingRowProps {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => void;
  getServiceLabel: (service: string) => string;
  getStatusColor: (status: string) => string;
  onClick: () => void;
  isSelected: boolean;
}

const BookingRow: React.FC<BookingRowProps> = ({
  booking,
  onEdit,
  onDelete,
  getServiceLabel,
  getStatusColor,
  onClick,
  isSelected
}) => {
  const { getStatusName } = useBookingStatus();

  return (
    <tr 
      onClick={onClick}
      className={`border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-700/50' : ''
      }`}
    >
      <td className="p-4 text-white">
        <div className="font-medium">
          {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
        </div>
        <div className="text-sm text-gray-400">
          {booking.booking_time}
        </div>
      </td>
      <td className="p-4 text-white">
        <div className="font-medium">
          {booking.firstName} {booking.lastName}
        </div>
      </td>
      <td className="p-4">
        <div className="space-y-2">
          <a
            href={`mailto:${booking.email}`}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <Mail size={16} />
            {booking.email}
          </a>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${booking.phone}`}
              className="flex items-center gap-1 text-green-400 hover:text-green-300"
            >
              <Phone size={16} />
              {booking.phone}
            </a>
            <a
              href={getWhatsAppLink(booking.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-1 bg-green-600 text-white rounded-full hover:bg-green-700"
              title="Contatta su WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </td>
      <td className="p-4 text-white">{getServiceLabel(booking.service_type)}</td>
      <td className="p-4 text-white font-mono">{booking.ticket_number}</td>
      <td className="p-4">
        <span
          className="px-3 py-1 rounded-full text-white text-sm"
          style={{ backgroundColor: getStatusColor(booking.status) }}
        >
          {getStatusName(booking.status)}
        </span>
      </td>
      <td className="p-4 text-white text-sm">{booking.notes || '-'}</td>
      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            title="Modifica prenotazione"
          >
    

            <Edit2 size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-400 hover:text-red-300 transition-colors"
            title="Elimina prenotazione"
          >
            <Trash2 size={20} />
          </button>
          <NotifyAppWhtz booking={booking} />

        </div>
      </td>
    </tr>
  );
};

export default BookingRow;