import { useState, useEffect, useCallback } from 'react';
import { EventSettings, subscribeToSettings, updateEventSettings } from '../lib/settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<EventSettings>) => {
    if (!settings) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await updateEventSettings(updates);
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Errore durante l\'aggiornamento delle impostazioni');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    resetError
  };
};