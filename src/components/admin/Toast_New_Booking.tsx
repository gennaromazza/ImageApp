import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Booking } from '../../types/booking';

interface ToastNewBookingProps {
  booking: Booking;
  onDismiss: (booking: Booking) => void;
}

const Toast_New_Booking: React.FC<ToastNewBookingProps> = ({ booking, onDismiss }) => {
  const handleClick = () => {
    onDismiss(booking);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center pointer-events-auto">
        <p className="mb-4 text-center text-black">
          Nuova prenotazione da <strong>{booking.firstName} {booking.lastName}</strong> <br/>
          per il <strong>{booking.booking_date}</strong> alle <strong>{booking.booking_time}</strong>
        </p>
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-green-600 text-white rounded flex items-center hover:bg-green-700"
        >
          <CheckCircle2 className="mr-2" size={20} />
          Vai alla prenotazione
        </button>
      </div>
    </div>
  );
};

export default Toast_New_Booking;
