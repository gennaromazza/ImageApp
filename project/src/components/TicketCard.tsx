import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Film, Clock, Mail, Phone, MapPin, CalendarPlus, Ticket, Calendar } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { formatPhoneWithPrefix } from '../utils/booking';
import type { EventSettings } from '../types/settings';

interface TicketCardProps {
  bookingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    service: string;
    ticketNumber: string;
    calendarLinks?: {
      google: string;
      ical: string;
    };
  };
  settings: EventSettings;
  selectedDate: Date;
  selectedTime: string;
  onDownload: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  bookingData,
  settings,
  selectedDate,
  selectedTime,
  onDownload
}) => {
  const serviceName = settings.serviceTypes.find(s => s.id === bookingData.service)?.name;

  // Validate the date before formatting
  const formattedDate = isValid(selectedDate) ? format(selectedDate, 'dd/MM/yyyy') : '';

  if (!formattedDate) {
    console.error('Invalid date provided to TicketCard');
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Ticket Container - 9:16 aspect ratio */}
      <div 
        id="ticket" 
        className="relative bg-[#f8f4e9] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-b from-[--theater-red] to-red-700 text-white p-6 text-center">
          <Film className="w-12 h-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">{settings.eventName}</h1>
          <p className="text-sm opacity-80">{settings.company.name}</p>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeSVG 
                value={bookingData.ticketNumber}
                size={150}
                bgColor="#ffffff"
                fgColor="#D22B2B"
                level="H"
                includeMargin={false}
              />
              <div className="mt-2 text-center font-mono text-sm text-[--theater-red]">
                {bookingData.ticketNumber}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Calendar className="w-5 h-5 text-[--theater-red]" />
              <div>
                <div className="text-sm text-gray-600">Data</div>
                <div className="font-semibold">{formattedDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Clock className="w-5 h-5 text-[--theater-red]" />
              <div>
                <div className="text-sm text-gray-600">Orario</div>
                <div className="font-semibold">{selectedTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Film className="w-5 h-5 text-[--theater-red]" />
              <div>
                <div className="text-sm text-gray-600">Servizio</div>
                <div className="font-semibold">{serviceName}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Mail className="w-5 h-5 text-[--theater-red]" />
              <div className="overflow-hidden">
                <div className="text-sm text-gray-600">Cliente</div>
                <div className="font-semibold truncate">
                  {bookingData.firstName} {bookingData.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate">{bookingData.email}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="text-center text-sm text-gray-600 mt-auto">
            <MapPin className="w-4 h-4 mx-auto mb-1" />
            <p>{settings.company.address}</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-4 w-2 h-2 bg-gray-800 rounded-full" />
        <div className="absolute top-0 right-4 w-2 h-2 bg-gray-800 rounded-full" />
        <div className="absolute bottom-0 left-4 w-2 h-2 bg-gray-800 rounded-full" />
        <div className="absolute bottom-0 right-4 w-2 h-2 bg-gray-800 rounded-full" />
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4 print:hidden">
        {bookingData.calendarLinks && (
          <>
            <a
              href={bookingData.calendarLinks.google}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[--theater-red] text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </a>
            <a
              href={bookingData.calendarLinks.ical}
              download="prenotazione.ics"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[--theater-red] text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              iCal/Outlook
            </a>
          </>
        )}
        <button
          onClick={onDownload}
          className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Ticket className="w-4 h-4" />
          Scarica Biglietto
        </button>
      </div>
    </div>
  );
};

export default TicketCard;