import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, parse } from 'date-fns';
import { useSettings } from '../../hooks/useSettings';

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  selectedTime,
  onTimeSelect
}) => {
  const { settings } = useSettings();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!settings) return;

    const slots: string[] = [];
    const [startHour, startMinute = 0] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute = 0] = settings.endTime.split(':').map(Number);
    const interval = settings.bookingIntervals || 30;

    let currentTime = setHours(setMinutes(selectedDate, startMinute), startHour);
    const endTime = setHours(setMinutes(selectedDate, endMinute), endHour);

    while (currentTime < endTime) {
      const timeSlot = format(currentTime, 'HH:mm');
      slots.push(timeSlot);
      currentTime = addMinutes(currentTime, interval);
    }

    setAvailableSlots(slots);
  }, [selectedDate, settings]);

  return (
    <div className="space-y-4">
      <label className="block text-gray-300">
        <Clock size={16} className="inline-block mr-2" />
        Orari Disponibili
      </label>
      
      <div className="grid grid-cols-4 gap-2">
        {availableSlots.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => onTimeSelect(time)}
            className={`
              p-2 rounded text-center transition-colors
              ${selectedTime === time
                ? 'bg-[--theater-gold] text-black'
                : 'bg-gray-700 text-white hover:bg-gray-600'
              }
            `}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;