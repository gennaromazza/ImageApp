import { db, auth } from './firebase';
import { 
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  runTransaction,
  collection
} from 'firebase/firestore';

export interface BookingStatus {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  order?: number;
  allowedTransitions?: string[]; // Stati verso cui è possibile transitare
  requiresNote?: boolean;        // Richiede una nota per la transizione
  isTerminal?: boolean;         // Stato finale che non permette ulteriori transizioni
}

export interface StatusHistoryEntry {
  id: string;
  bookingId: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
  changedBy: string;
  changedByEmail: string;
  changedAt: Date;
}

// Cache degli stati per ottimizzare le performance
let statusCache: Map<string, BookingStatus> = new Map();

// Funzione per aggiornare la cache
const updateStatusCache = (statuses: BookingStatus[]) => {
  statusCache.clear();
  statuses.forEach(status => statusCache.set(status.id, status));
};

// Funzione per ottenere uno stato dalla cache
export const getStatusFromCache = (id: string): BookingStatus | undefined => {
  return statusCache.get(id);
};

// Verifica se una transizione di stato è valida
export const isValidTransition = (fromStatus: string, toStatus: string): boolean => {
  const currentStatus = statusCache.get(fromStatus);
  if (!currentStatus) return false;
  
  // Se lo stato corrente è terminale, non sono permesse transizioni
  if (currentStatus.isTerminal) return false;
  
  // Se non ci sono transizioni specificate, permettiamo tutte
  if (!currentStatus.allowedTransitions) return true;
  
  return currentStatus.allowedTransitions.includes(toStatus);
};

// Verifica se una nota è richiesta per la transizione
export const isNoteRequired = (fromStatus: string, toStatus: string): boolean => {
  const targetStatus = statusCache.get(toStatus);
  return targetStatus?.requiresNote || false;
};

export const addBookingStatus = async (status: Omit<BookingStatus, 'id'>): Promise<BookingStatus> => {
  try {
    const settingsRef = doc(db, 'settings', 'event-settings');
    const batch = writeBatch(db);

    // Get current settings to update statuses
    const settingsDoc = await settingsRef.get();
    const currentSettings = settingsDoc.data();
    const currentStatuses = currentSettings?.bookingStatuses || [];

    // Validazione del nuovo stato
    if (currentStatuses.some(s => s.name.toLowerCase() === status.name.toLowerCase())) {
      throw new Error('Esiste già uno stato con questo nome');
    }

    // Create new status
    const newStatus = {
      ...status,
      id: status.name.toLowerCase().replace(/\s+/g, '_'),
      order: currentStatuses.length,
      allowedTransitions: status.allowedTransitions || [],
      requiresNote: status.requiresNote || false,
      isTerminal: status.isTerminal || false
    };

    // Add to settings
    batch.update(settingsRef, {
      bookingStatuses: [...currentStatuses, newStatus]
    });

    await batch.commit();

    // Update cache
    statusCache.set(newStatus.id, newStatus);
    return newStatus;
  } catch (error) {
    console.error('Error adding booking status:', error);
    throw error;
  }
};

export const updateBookingStatus = async (statusId: string, updates: Partial<BookingStatus>): Promise<void> => {
  try {
    const settingsRef = doc(db, 'settings', 'event-settings');
    
    await runTransaction(db, async (transaction) => {
      const settingsDoc = await transaction.get(settingsRef);
      const currentSettings = settingsDoc.data();
      const currentStatuses = currentSettings?.bookingStatuses || [];
      
      const statusIndex = currentStatuses.findIndex(s => s.id === statusId);
      if (statusIndex === -1) throw new Error('Stato non trovato');
      
      // Aggiorna lo stato mantenendo i campi esistenti
      const updatedStatus = {
        ...currentStatuses[statusIndex],
        ...updates,
        id: statusId // Mantieni l'ID originale
      };
      
      currentStatuses[statusIndex] = updatedStatus;
      
      transaction.update(settingsRef, {
        bookingStatuses: currentStatuses
      });
      
      // Aggiorna la cache
      statusCache.set(statusId, updatedStatus);
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const recordStatusChange = async (
  bookingId: string,
  fromStatus: string,
  toStatus: string,
  note?: string
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  // Verifica se la transizione è valida
  if (!isValidTransition(fromStatus, toStatus)) {
    throw new Error('Transizione di stato non valida');
  }

  // Verifica se è richiesta una nota
  if (isNoteRequired(fromStatus, toStatus) && !note) {
    throw new Error('È richiesta una nota per questo cambio di stato');
  }

  try {
    const batch = writeBatch(db);
    
    // Aggiorna lo stato della prenotazione
    const bookingRef = doc(db, 'bookings', bookingId);
    batch.update(bookingRef, {
      status: toStatus,
      lastStatusUpdate: serverTimestamp()
    });

    // Registra la modifica nello storico
    const historyRef = collection(db, 'statusHistory');
    batch.set(doc(historyRef), {
      bookingId,
      fromStatus,
      toStatus,
      note,
      changedBy: auth.currentUser.uid,
      changedByEmail: auth.currentUser.email,
      changedAt: serverTimestamp()
    });

    await batch.commit();

    // Trigger degli eventi di cambio stato
    await triggerStatusChangeEvents(bookingId, fromStatus, toStatus);
  } catch (error) {
    console.error('Error recording status change:', error);
    throw error;
  }
};

// Eventi da triggerare al cambio di stato
const triggerStatusChangeEvents = async (
  bookingId: string,
  fromStatus: string,
  toStatus: string
) => {
  const bookingRef = doc(db, 'bookings', bookingId);
  const bookingDoc = await bookingRef.get();
  const bookingData = bookingDoc.data();

  if (!bookingData) return;

  // Esempio di eventi basati sul nuovo stato
  switch (toStatus) {
    case 'confirmed':
      // Invia email di conferma
      await sendStatusChangeEmail(bookingData.email, 'confirmed', bookingData);
      break;
    case 'cancelled':
      // Libera lo slot nel calendario
      await freeBookingSlot(bookingData.booking_date, bookingData.booking_time);
      break;
    case 'completed':
      // Aggiorna le statistiche
      await updateBookingStats(bookingId);
      break;
  }
};

// Funzioni di supporto per gli eventi
const sendStatusChangeEmail = async (email: string, status: string, bookingData: any) => {
  // Implementazione dell'invio email
};

const freeBookingSlot = async (date: string, time: string) => {
  // Implementazione della liberazione slot
};

const updateBookingStats = async (bookingId: string) => {
  // Implementazione dell'aggiornamento statistiche
};

export const getStatusHistory = async (bookingId: string): Promise<StatusHistoryEntry[]> => {
  try {
    const historyQuery = query(
      collection(db, 'statusHistory'),
      where('bookingId', '==', bookingId),
      orderBy('changedAt', 'desc')
    );
    
    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate()
    })) as StatusHistoryEntry[];
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
};

export const subscribeToStatusHistory = (
  bookingId: string,
  callback: (history: StatusHistoryEntry[]) => void
): (() => void) => {
  const historyQuery = query(
    collection(db, 'statusHistory'),
    where('bookingId', '==', bookingId),
    orderBy('changedAt', 'desc')
  );

  return onSnapshot(historyQuery, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate()
    })) as StatusHistoryEntry[];
    callback(history);
  });
};

export const subscribeToBookingStatuses = (
  callback: (statuses: BookingStatus[]) => void
): (() => void) => {
  const settingsRef = doc(db, 'settings', 'event-settings');

  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      const settings = doc.data();
      const statuses = settings?.bookingStatuses || [];
      updateStatusCache(statuses);
      callback(statuses);
    } else {
      callback([]);
    }
  });
};