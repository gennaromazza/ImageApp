import { useState, useEffect, useCallback } from 'react';
import type { StatusHistoryEntry } from '../lib/bookingStatus';
import { 
  subscribeToStatusHistory, 
  recordStatusChange,
  getStatusHistory 
} from '../lib/bookingStatus';

export const useStatusHistory = (bookingId: string) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStatusHistory(bookingId, (newHistory) => {
      setHistory(newHistory);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [bookingId]);

  const recordChange = useCallback(async (
    fromStatus: string,
    toStatus: string,
    note?: string
  ) => {
    setSaving(true);
    setError(null);
    
    try {
      await recordStatusChange(bookingId, fromStatus, toStatus, note);
    } catch (error) {
      console.error('Error recording status change:', error);
      setError('Errore durante la registrazione del cambio di stato');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [bookingId]);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newHistory = await getStatusHistory(bookingId);
      setHistory(newHistory);
    } catch (error) {
      console.error('Error refreshing history:', error);
      setError('Errore durante l\'aggiornamento dello storico');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    history,
    loading,
    error,
    saving,
    recordChange,
    refreshHistory,
    resetError
  };
};