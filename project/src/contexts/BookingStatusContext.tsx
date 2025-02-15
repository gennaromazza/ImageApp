import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { BookingStatus } from '../lib/bookingStatus';
import { subscribeToBookingStatuses } from '../lib/bookingStatus';

interface BookingStatusContextType {
  statuses: BookingStatus[];
  loading: boolean;
  error: string | null;
  getStatusById: (id: string) => BookingStatus | undefined;
  getStatusColor: (id: string) => string;
  getStatusName: (id: string) => string;
  refreshStatuses: () => void;
}

const BookingStatusContext = createContext<BookingStatusContextType | undefined>(undefined);

export const BookingStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToBookingStatuses((newStatuses) => {
      setStatuses(newStatuses);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  const getStatusById = (id: string) => statuses.find(s => s.id === id);
  const getStatusColor = (id: string) => getStatusById(id)?.color || '#718096';
  const getStatusName = (id: string) => getStatusById(id)?.name || id;
  const refreshStatuses = () => setRefreshKey(prev => prev + 1);

  return (
    <BookingStatusContext.Provider value={{
      statuses,
      loading,
      error,
      getStatusById,
      getStatusColor,
      getStatusName,
      refreshStatuses
    }}>
      {children}
    </BookingStatusContext.Provider>
  );
};

export const useBookingStatus = () => {
  const context = useContext(BookingStatusContext);
  if (!context) {
    throw new Error('useBookingStatus must be used within a BookingStatusProvider');
  }
  return context;
};