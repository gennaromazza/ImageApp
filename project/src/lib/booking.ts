import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { addToGoogleCalendar } from './calendar';

// Funzione per generare URL prenotazione
export const getBookingUrl = (): string => {
  const basePath = import.meta.env.DEV ? '' : '/carnival2025';
  return `${window.location.origin}${basePath}/prenota`;
};

// Funzione per ottenere le prenotazioni per una data specifica
export const getBookingsForDate = async (date: string) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("booking_date", "==", date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching bookings for date:', error);
    throw error;
  }
};

// Funzione per creare una prenotazione
export const createBooking = async (bookingData: any) => {
  try {
    // Assicura che la data sia nel formato corretto (YYYY-MM-DD)
    const bookingDate = new Date(bookingData.booking_date);
    if (isNaN(bookingDate.getTime())) {
      throw new Error('Data di prenotazione non valida');
    }

    // Formatta la data per salvarla correttamente
    const formattedDate = bookingDate.toISOString().split('T')[0];

    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      booking_date: formattedDate,
      created_at: serverTimestamp()
    });

    // Verifica se l'utente ha Google Calendar connesso
    if (bookingData.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
        const userData = userDoc.data();

        if (userData?.calendarConnected) {
          // Crea l'orario di inizio e fine dell'evento
          const startTime = new Date(`${formattedDate}T${bookingData.booking_time}`);
          const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // Aggiunge 1 ora

          await addToGoogleCalendar(bookingData.userId, {
            summary: `Prenotazione Fotografica - ${bookingData.firstName} ${bookingData.lastName}`,
            description: `Prenotazione: ${bookingData.ticket_number}\nServizio: ${bookingData.service_type}`,
            startTime,
            endTime,
            location: 'Via Quinto Orazio Flacco 5, Aversa'
          });
        }
      } catch (error) {
        console.error('Error syncing with Google Calendar:', error);
        // Non blocca la creazione della prenotazione se la sincronizzazione fallisce
      }
    }

    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Funzione per ottenere tutte le prenotazioni
export const getBookings = async () => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      booking_date: doc.data().booking_date
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

// Funzione per aggiornare una prenotazione
export const updateBooking = async (bookingId: string, updates: any) => {
  try {
    // Se si aggiorna la data, assicurati che sia nel formato corretto
    if (updates.booking_date) {
      const bookingDate = new Date(updates.booking_date);
      if (isNaN(bookingDate.getTime())) {
        throw new Error('Data di prenotazione non valida');
      }
      updates.booking_date = bookingDate.toISOString().split('T')[0];
    }

    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

// Funzione per validare una data di prenotazione
export const validateBookingDate = (date: string): boolean => {
  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime())) {
    return false;
  }
  
  // Assicura che la data non sia nel passato
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDate >= today;
};
