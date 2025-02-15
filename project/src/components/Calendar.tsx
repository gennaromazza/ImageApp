import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Ban,
  Check,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  format,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  isSameDay,
  startOfToday
} from 'date-fns';
import { it } from 'date-fns/locale';
import { useSettings } from '../hooks/useSettings';
import { getBookingsForDate } from '../lib/booking';

interface CalendarProps {
  selectedDate?: Date | null;
  selectedTime?: string;
  selectedService?: string;
  onSlotSelect: (date: Date, time: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  selectedTime,
  selectedService,
  onSlotSelect
}) => {
  const { settings, loading: settingsLoading } = useSettings();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  // Helper: determina se una data deve essere esclusa
  const isDateExcluded = (date: Date): boolean => {
    if (!settings) return true;
    const serviceType = settings.serviceTypes.find(s => s.id === selectedService || s.enabled);
    if (!serviceType) return true;
    if (serviceType.bookingStartDate && serviceType.bookingEndDate) {
      const startDate = parseISO(serviceType.bookingStartDate);
      const endDate = parseISO(serviceType.bookingEndDate);
      if (isBefore(date, startDate) || date > endDate) return true;
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    if (serviceType.excludedDates?.includes(dateStr)) return true;
    const dayOfWeek = date.getDay();
    return serviceType.excludedDays?.includes(dayOfWeek) || false;
  };

  // Helper: verifica se un orario cade in una pausa
  const isBreakTime = (time: string): boolean => {
    if (!settings?.breakTimes) return false;
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);
    return settings.breakTimes.some(breakTime => {
      if (!breakTime.enabled) return false;
      const [startHours, startMinutes] = breakTime.start.split(':').map(Number);
      const [endHours, endMinutes] = breakTime.end.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);
      const endDate = new Date();
      endDate.setHours(endHours, endMinutes, 0, 0);
      return timeDate >= startDate && timeDate < endDate;
    });
  };

  // Genera gli slot orari disponibili per una data
  const generateTimeSlots = (date: Date, existingBookings: any[]): string[] => {
    if (!settings || isDateExcluded(date)) return [];
    const slots: string[] = [];
    const [startHour, startMinute = 0] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute = 0] = settings.endTime.split(':').map(Number);
    const serviceType = settings.serviceTypes.find(s => s.id === selectedService || s.enabled);
    const interval = serviceType?.duration || settings.bookingIntervals || 30;
    let currentTime = setHours(setMinutes(new Date(date), startMinute), startHour);
    const endTime = setHours(setMinutes(new Date(date), endMinute), endHour);
    const bookedSlots = (existingBookings || [])
      .filter((booking: any) => isSameDay(parseISO(booking.booking_date), date) && booking.status !== 'canceled')
      .map((booking: any) => booking.booking_time);
    while (currentTime < endTime) {
      const timeSlot = format(currentTime, 'HH:mm');
      const isBreak = isBreakTime(timeSlot);
      const isBooked = bookedSlots.includes(timeSlot);
      if (!isBreak && !isBooked) {
        slots.push(timeSlot);
      }
      currentTime = addMinutes(currentTime, interval);
    }
    return slots;
  };

  // Gestisce la selezione di una data
  const handleDateSelect = (date: Date) => {
    if (isDateExcluded(date)) return;
    const cleanDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const slots = generateTimeSlots(cleanDate, bookings);
    if (slots.length === 0) return;
    onSlotSelect(cleanDate, slots[0]);
  };

  // Gestisce la selezione di un orario
  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return;
    onSlotSelect(selectedDate, time);
  };

  // Imposta il mese iniziale in base alle impostazioni
  useEffect(() => {
    if (!settings) return;
    const serviceType = settings.serviceTypes.find(s => s.enabled);
    if (serviceType?.bookingStartDate) {
      const startDate = parseISO(serviceType.bookingStartDate);
      const today = startOfToday();
      setCurrentMonth(isBefore(startDate, today) ? today : startDate);
    }
    setLoading(false);
  }, [settings, settingsLoading]);

  // Recupera le prenotazioni per la data selezionata
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      getBookingsForDate(dateStr).then((fetchedBookings: any[]) => {
        setBookings(fetchedBookings);
        const slots = generateTimeSlots(selectedDate, fetchedBookings);
        setAvailableSlots(prev => ({ ...prev, [dateStr]: slots }));
      });
    }
  }, [selectedDate]);

  // Aggiorna gli slot disponibili quando cambiano data, impostazioni o prenotazioni
  useEffect(() => {
    if (!selectedDate || !settings) return;
    const slots = generateTimeSlots(selectedDate, bookings);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setAvailableSlots(prev => ({ ...prev, [dateStr]: slots }));
  }, [selectedDate, settings, selectedService, bookings]);

  // Calcola i giorni da visualizzare nel calendario
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstDayOfMonth = date.getDay();
    const adjustedIndex = (firstDayOfMonth + 6) % 7;
    date.setDate(1 - adjustedIndex + i);
    return date;
  });

  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white flex items-center gap-2"
        >
          <div className="animate-spin">⌛</div>
          Caricamento calendario...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[--theater-gold]" />
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
            <div key={day} className="text-center text-gray-400 text-sm py-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const excluded = isDateExcluded(day);
            const slots = generateTimeSlots(day, bookings);
            const hasSlots = slots.length > 0;
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
            const isPast = day < startOfToday();
            const isDisabled = excluded || isPast || !hasSlots;
            const isHovered = hoveredDate && format(hoveredDate, 'yyyy-MM-dd') === dateStr;

            return (
              <motion.button
                key={dateStr}
                onClick={() => !isDisabled && handleDateSelect(day)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.05 } : undefined}
                whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                className={`
                  relative p-3 rounded-lg text-center transition-all duration-200
                  ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}
                  ${isSelected 
                    ? 'bg-[--theater-gold] text-black shadow-lg ring-2 ring-[--theater-gold] ring-opacity-50' 
                    : isHovered && !isDisabled
                      ? 'bg-gray-700 text-white shadow-md'
                      : isDisabled
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : hasSlots
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-800 text-gray-500'
                  }
                `}
              >
                <span className="relative z-10 font-medium">
                  {format(day, 'd')}
                </span>
                {excluded && (
                  <Ban size={12} className="absolute top-1 right-1 text-red-400" />
                )}
                {hasSlots && !isPast && !excluded && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5"
                  >
                    {[...Array(Math.min(3, slots.length))].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-black' : isHovered ? 'bg-white' : 'bg-[--theater-gold]'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedDate && availableSlots[format(selectedDate, 'yyyy-MM-dd')] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 space-y-4"
            >
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[--theater-gold]" />
                Orari disponibili per il {format(selectedDate, 'd MMMM yyyy', { locale: it })}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots[format(selectedDate, 'yyyy-MM-dd')]?.map(time => (
                  <motion.button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: 'var(--theater-gold)',
                      color: 'black',
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative p-3 rounded-lg text-center transition-all duration-200
                      ${selectedTime === time
                        ? 'bg-[--theater-gold] text-black shadow-lg ring-2 ring-[--theater-gold] ring-opacity-50'
                        : 'bg-gray-700 text-white hover:shadow-md'
                      }
                    `}
                  >
                    {time}
                    {selectedTime === time && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;
