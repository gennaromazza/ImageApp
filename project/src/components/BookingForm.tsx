import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateCalendarLinks } from '../lib/calendar';
import { validatePhoneNumber, formatPhone } from '../utils/booking';
import Calendar from './Calendar';
import { useSettings } from '../hooks/useSettings';
import html2canvas from 'html2canvas';
import TicketCard from './TicketCard';
import { createRoot } from 'react-dom/client';
import TicketStamp from './animations/TicketStamp';

const createBookingSchema = (serviceTypes: string[]) => z.object({
  firstName: z.string().min(2, 'Nome richiesto'),
  lastName: z.string().min(2, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().min(9, 'Numero di telefono non valido').max(10, 'Numero di telefono non valido'),
  service: z.enum(serviceTypes as [string, ...string[]], {
    required_error: 'Seleziona un tipo di servizio',
  }),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<ReturnType<typeof createBookingSchema>>;

interface BookingFormProps {
  existingBookings?: any[];
}

const BookingForm: React.FC<BookingFormProps> = ({ existingBookings = [] }) => {
  const { settings, loading: settingsLoading } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showTicket, setShowTicket] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingFormData & { 
    ticketNumber?: string;
    calendarLinks?: { google: string; ical: string; };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState<Date | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string>('');

  const enabledServiceTypes = settings?.serviceTypes
    .filter(s => s.enabled)
    .map(s => s.id) || [];

  const schema = createBookingSchema(enabledServiceTypes);

  const { register, handleSubmit: handleFormSubmit, formState: { errors }, reset, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (settings?.serviceTypes && !selectedService) {
      const enabledServices = settings.serviceTypes.filter(s => s.enabled);
      if (enabledServices.length > 0) {
        const firstService = enabledServices[0];
        setSelectedService(firstService.id);
        setValue('service', firstService.id);
      }
    }
  }, [settings?.serviceTypes, selectedService, setValue]);

  const generateTicketNumber = () => {
    return `CNC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const handleSlotSelect = (date: Date, time: string) => {
    // Ensure date is in UTC
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    setSelectedDate(utcDate);
    setSelectedTime(time);
  };

  const showTicketStampAnimation = async (ticketNumber: string) => {
    return new Promise<void>((resolve) => {
      const stampContainer = document.createElement('div');
      document.body.appendChild(stampContainer);
      
      const root = createRoot(stampContainer);
      root.render(
        <TicketStamp
          type={settings?.ticketTemplate?.type || 'classic'}
          ticketNumber={ticketNumber}
          onComplete={() => {
            root.unmount();
            document.body.removeChild(stampContainer);
            resolve();
          }}
        />
      );
    });
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTime || !settings) {
      setError('Seleziona data e ora per la prenotazione');
      return;
    }

    if (!validatePhoneNumber(data.phone)) {
      setError('Inserisci un numero di telefono italiano valido (9-10 cifre)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formattedPhone = formatPhone(data.phone);

      // Format date to ISO string and take only the date part
      const formattedDate = selectedDate.toISOString().split('T')[0];

      const ticketNumber = generateTicketNumber();
      const startTime = new Date(`${formattedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + settings.bookingIntervals * 60000);

      const serviceName = settings.serviceTypes.find(s => s.id === data.service)?.name || 'Servizio Fotografico';
      const calendarLinks = generateCalendarLinks(
        settings.eventName,
        `${serviceName}\nPrenotazione: ${ticketNumber}\nNome: ${data.firstName} ${data.lastName}`,
        startTime,
        endTime
      );

      await addDoc(collection(db, 'bookings'), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: formattedPhone,
        service_type: data.service,
        booking_date: formattedDate,
        booking_time: selectedTime,
        ticket_number: ticketNumber,
        notes: data.notes,
        status: 'pending',
        created_at: serverTimestamp()
      });

      // Store confirmed date and time
      setConfirmedDate(selectedDate);
      setConfirmedTime(selectedTime);

      // Store booking data
      setBookingData({ 
        ...data, 
        ticketNumber, 
        calendarLinks 
      });

      if (settings.ticketTemplate?.enabled) {
        await showTicketStampAnimation(ticketNumber);
      }

      // Set booking as complete and show ticket
      setBookingComplete(true);
      setShowTicket(true);

      // Reset form state
      reset();
      setSelectedDate(null);
      setSelectedTime('');
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Errore durante la prenotazione. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="text-center text-white">
        Caricamento...
      </div>
    );
  }

  // Show ticket after successful booking
  if (bookingComplete && showTicket && bookingData && bookingData.ticketNumber && settings && confirmedDate) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <TicketCard
          bookingData={bookingData}
          settings={settings}
          selectedDate={confirmedDate}
          selectedTime={confirmedTime}
          onDownload={() => {
            const ticketElement = document.getElementById('ticket');
            if (ticketElement) {
              html2canvas(ticketElement, {
                scale: 2,
                backgroundColor: '#f8f4e9',
                logging: false,
                useCORS: true,
                allowTaint: true,
                onclone: (clonedDoc) => {
                  const clonedTicket = clonedDoc.getElementById('ticket');
                  if (clonedTicket) {
                    clonedTicket.style.display = 'block';
                    clonedTicket.style.width = '800px';
                    clonedTicket.style.height = 'auto';
                  }
                }
              }).then(canvas => {
                const link = document.createElement('a');
                link.download = `biglietto-${bookingData.ticketNumber}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
              });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="mb-4">
          <select
            {...register('service')}
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setValue('service', e.target.value);
            }}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
          >
            <option value="">Seleziona servizio</option>
            {settings?.serviceTypes
              .filter(service => service.enabled)
              .map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
          </select>
          {errors.service && <p className="text-red-500 mt-1">{errors.service.message}</p>}
        </div>

        <Calendar 
          onSlotSelect={handleSlotSelect} 
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedService={selectedService}
        />
      </div>

      <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        {selectedDate && selectedTime && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
            Hai selezionato: {selectedDate.toLocaleDateString()} alle {selectedTime}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2">Nome</label>
            <input
              {...register('firstName')}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
              placeholder="Mario"
            />
            {errors.firstName && <p className="text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-white mb-2">Cognome</label>
            <input
              {...register('lastName')}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
              placeholder="Rossi"
            />
            {errors.lastName && <p className="text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-white mb-2">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
            placeholder="mario.rossi@example.com"
          />
          {errors.email && <p className="text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-white mb-2">Telefono</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              {...register('phone')}
              className="w-full pl-10 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
              placeholder="Inserisci il numero senza prefisso (es: 3401234567)"
            />
          </div>
          {errors.phone && <p className="text-red-500 mt-1">{errors.phone.message}</p>}
          <p className="text-sm text-gray-400 mt-1">
            Inserisci solo le cifre del numero senza prefisso internazionale
          </p>
        </div>

        <div>
          <label className="block text-white mb-2">Note (opzionale)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[--theater-gold] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedTime}
          className="w-full bg-[--theater-red] text-white py-3 px-6 rounded-full hover:bg-red-700 transition-colors text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Conferma in corso...' : 'Conferma Prenotazione'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;