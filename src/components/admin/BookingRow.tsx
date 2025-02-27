import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleOvalLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';
import type { Booking } from '../../types/booking';
import { getWhatsAppLink } from '../../utils/booking';
import { useBookingStatus } from '../../contexts/BookingStatusContext';
import NotifyAppWhtz from './NotifyAppWhtz';

// Assicurati di aver importato globalmente: 
// import 'react-quill/dist/quill.snow.css'; 
// (per esempio, in App.tsx o in _app.tsx se usi Next.js)

interface BookingRowProps {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  getServiceLabel: (service: string) => string;
  getStatusColor: (status: string) => string;
  onClick: () => void;
  isSelected: boolean;
  rowId?: string;
  className?: string;
}

const BookingRow: React.FC<BookingRowProps> = ({
  booking,
  onEdit,
  onDelete,
  getServiceLabel,
  getStatusColor,
  onClick,
  isSelected,
  rowId = '',
  className = '',
}) => {
  const { getStatusName } = useBookingStatus();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Per aprire/chiudere il modale con la nota completa
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  return (
    <>
      <tr
        id={rowId}
        onClick={onClick}
        className={`border-b border-gray-700 cursor-pointer transition-colors ${
          isSelected ? 'bg-gray-700/50' : 'hover:bg-gray-700/20'
        } ${className}`}
      >
        {/* Data e ora */}
        <td className="p-4 text-white">
          <div className="font-medium">
            {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
          </div>
          <div className="text-sm text-gray-400">{booking.booking_time}</div>
        </td>

        {/* Nome e cognome */}
        <td className="p-4 text-white">
          <div className="font-medium">
            {booking.firstName} {booking.lastName}
          </div>
        </td>

        {/* Email / Telefono / WhatsApp */}
        <td className="p-4">
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${booking.email}`}
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-blue-400 hover:text-blue-300 transition-colors"
              title={`Invia email a ${booking.email}`}
            >
              <EnvelopeIcon className="w-5 h-5" />
            </a>
            <a href={`tel:${booking.phone}`} title={`Chiama ${booking.phone}`}>
              <PhoneIcon className="w-5 h-5 text-white" />
            </a>
            <a
              href={getWhatsAppLink(booking.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-green-600 hover:text-green-500 transition-colors"
              title={`Messaggia su WhatsApp a ${booking.phone}`}
            >
              <ChatBubbleOvalLeftIcon className="w-5 h-5" />
            </a>
          </div>
        </td>

        {/* Servizio */}
        <td className="p-4 text-white">{getServiceLabel(booking.service_type)}</td>

        {/* Ticket Number */}
        <td className="p-4 text-white font-mono">{booking.ticket_number}</td>

        {/* Stato */}
        <td className="p-4">
          <span
            className="px-3 py-1 rounded-full text-white text-sm w-28 text-center block truncate whitespace-nowrap"
            style={{ backgroundColor: getStatusColor(booking.status) }}
          >
            {getStatusName(booking.status)}
          </span>
        </td>

        {/* Note (mostrate parzialmente) */}
        <td className="p-4 text-white text-sm">
          {booking.notes ? (
            // Usiamo .ql-editor per ereditare gli stili di Quill (elenchi, etc.)
            <div
              className="ql-editor cursor-pointer line-clamp-2 text-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsNoteModalOpen(true);
              }}
              dangerouslySetInnerHTML={{ __html: booking.notes || '' }}
            />
          ) : (
            '-'
          )}
        </td>

        {/* Azioni */}
        <td className="p-4">
          <div className="flex items-center justify-end">
            {/* Azioni per desktop */}
            <div className="hidden md:flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Modifica prenotazione"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-red-400 hover:text-red-300 transition-colors"
                title="Elimina prenotazione"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <NotifyAppWhtz booking={booking} />
            </div>

            {/* Dropdown per mobile */}
            <div className="md:hidden relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="p-2 rounded hover:bg-gray-600"
                title="Azioni"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-white" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    Modifica
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Elimina
                  </button>
                  <div className="px-4 py-2 hover:bg-gray-700">
                    <NotifyAppWhtz booking={booking} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* Modale con la nota completa */}
      {isNoteModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-4 max-w-2xl w-full relative"
            onClick={(e) => e.stopPropagation()} // Evita la chiusura cliccando sul contenuto
          >
            <button
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute top-2 right-2 text-white text-xl"
              title="Chiudi"
            >
              &times;
            </button>
            {/* Stesso trucco: .ql-editor per gli stili di Quill */}
            <div
              className="ql-editor text-white"
              dangerouslySetInnerHTML={{ __html: booking.notes || '' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BookingRow;
