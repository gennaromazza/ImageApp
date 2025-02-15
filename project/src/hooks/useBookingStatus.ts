import { useState, useEffect, useCallback } from 'react';
import { 
  BookingStatus, 
  subscribeToBookingStatuses,
  addBookingStatus,
  updateBookingStatus,
  deleteBookingStatus,
  reorderBookingStatuses,
  canDeleteBookingStatus
} from '../lib/bookingStatus';

export const useBookingStatus = () => {
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToBookingStatuses((newStatuses) => {
      setStatuses(newStatuses);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const addStatus = useCallback(async (status: Omit<BookingStatus, 'id'>) => {
    setSaving(true);
    setError(null);
    
    try {
      const newStatus = await addBookingStatus(status);
      return newStatus;
    } catch (error) {
      console.error('Error adding status:', error);
      setError('Errore durante l\'aggiunta dello stato');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, updates: Partial<BookingStatus>) => {
    setSaving(true);
    setError(null);
    
    try {
      await updateBookingStatus(id, updates);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Errore durante l\'aggiornamento dello stato');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteStatus = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const canDelete = await canDeleteBookingStatus(id);
      if (!canDelete) {
        throw new Error('Non è possibile eliminare questo stato perché è in uso');
      }
      await deleteBookingStatus(id);
    } catch (error) {
      console.error('Error deleting status:', error);
      setError(error instanceof Error ? error.message : 'Errore durante l\'eliminazione dello stato');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const reorderStatuses = useCallback(async (statusIds: string[]) => {
    setSaving(true);
    setError(null);
    
    try {
      await reorderBookingStatuses(statusIds);
    } catch (error) {
      console.error('Error reordering statuses:', error);
      setError('Errore durante il riordinamento degli stati');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const getStatusById = useCallback((id: string) => {
    return statuses.find(s => s.id === id);
  }, [statuses]);

  const getStatusColor = useCallback((id: string) => {
    return getStatusById(id)?.color || '#718096';
  }, [getStatusById]);

  const getStatusName = useCallback((id: string) => {
    return getStatusById(id)?.name || id;
  }, [getStatusById]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    statuses,
    loading,
    error,
    saving,
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    getStatusById,
    getStatusColor,
    getStatusName,
    resetError
  };
};