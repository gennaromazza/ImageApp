import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const GOOGLE_CONFIG = {
  clientId: '164337596330-todg1eiufp3sb6h4aotrnq6srh06a478.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: `${window.location.origin}/calendar/callback`,
  scopes: ['https://www.googleapis.com/auth/calendar.events']
};

export const CALENDAR_SETTINGS = {
  defaultDuration: 60, // minuti
  defaultReminder: 60, // minuti prima dell'evento
  timeZone: 'Europe/Rome'
};

/**
 * Scambia il codice di autorizzazione per ottenere i token (access e refresh) e li salva su Firestore.
 */
export const handleGoogleCalendarCallback = async (code: string, userId: string) => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CONFIG.clientId,
        client_secret: GOOGLE_CONFIG.clientSecret,
        redirect_uri: GOOGLE_CONFIG.redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });
    if (!response.ok) {
      throw new Error('Errore nello scambio del codice per il token');
    }
    const tokens = await response.json();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { googleCalendarToken: tokens }, { merge: true });
    return tokens;
  } catch (error) {
    console.error('Errore in handleGoogleCalendarCallback:', error);
    throw error;
  }
};

/**
 * Aggiunge un evento al calendario Google usando il token salvato su Firestore.
 */
export const addToGoogleCalendar = async (
  userId: string,
  eventData: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('Utente non trovato');
    }
    const data = userDoc.data();
    const token = data?.googleCalendarToken;
    if (!token || !token.access_token) {
      throw new Error('Token Google Calendar non trovato');
    }
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: eventData.summary,
          description: eventData.description,
          start: {
            dateTime: eventData.startDateTime,
            timeZone: CALENDAR_SETTINGS.timeZone
          },
          end: {
            dateTime: eventData.endDateTime,
            timeZone: CALENDAR_SETTINGS.timeZone
          }
        })
      }
    );
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Errore durante l'aggiunta dell'evento: ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Errore in addToGoogleCalendar:', error);
    throw error;
  }
};

/**
 * Sincronizza tutte le prenotazioni dell'utente con Google Calendar.
 * Recupera le prenotazioni (stub: sostituisci con la logica reale) e per ciascuna chiama addToGoogleCalendar.
 */
export const syncAllBookingsToGoogleCalendar = async (userId: string) => {
  try {
    const bookings = await getBookingsForUser(userId);
    for (const booking of bookings) {
      await addToGoogleCalendar(userId, booking);
    }
    return true;
  } catch (error) {
    console.error('Errore in syncAllBookingsToGoogleCalendar:', error);
    throw error;
  }
};

/**
 * Funzione stub per il recupero delle prenotazioni dell'utente.
 * Sostituisci questa funzione con la logica reale per ottenere i booking.
 */
const getBookingsForUser = async (userId: string): Promise<Array<{
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
}>> => {
  // TODO: implementa il recupero reale delle prenotazioni per l'utente
  return [];
};

/**
 * Genera link per aggiungere l'evento ai vari calendari.
 * In questo esempio viene generato un link per Google Calendar.
 */
export const generateCalendarLinks = (eventData: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}) => {
  // Helper per formattare la data in formato compatibile con Google Calendar (YYYYMMDDTHHmmssZ)
  const formatDate = (dateStr: string): string => {
    if (!dateStr) {
      throw new Error("Il parametro data è mancante.");
    }
    return dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  if (!eventData.startDateTime || !eventData.endDateTime) {
    throw new Error("startDateTime ed endDateTime sono obbligatori.");
  }

  const start = formatDate(eventData.startDateTime);
  const end = formatDate(eventData.endDateTime);
  const text = encodeURIComponent(eventData.summary);
  const details = encodeURIComponent(eventData.description || '');
  const locationPart = eventData.location ? `&location=${encodeURIComponent(eventData.location)}` : '';

  const googleCalendarLink = `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${start}/${end}&details=${details}${locationPart}`;

  return {
    googleCalendar: googleCalendarLink
    // Puoi aggiungere altri link (es. Outlook, iCal, ecc.) se necessario.
  };
};
