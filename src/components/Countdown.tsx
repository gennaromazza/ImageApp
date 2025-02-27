import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface CountdownProps {
  targetDate: string;
  eventName: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, eventName }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetDate);
      const now = new Date();

      setTimeLeft({
        days: differenceInDays(target, now),
        hours: differenceInHours(target, now) % 24,
        minutes: differenceInMinutes(target, now) % 60,
        seconds: differenceInSeconds(target, now) % 60
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl text-white text-center">
        {eventName} inizia tra:
      </h2>
      <div className="flex justify-center gap-4 text-white">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="bg-[--theater-red] rounded-lg p-3 min-w-[80px]">
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <div className="text-sm mt-1 capitalize">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;