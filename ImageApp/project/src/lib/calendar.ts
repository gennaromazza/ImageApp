import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
 * Tipo per ogni prenotazione.
 */
export type Booking = {
  id: string;  
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  status: 'confirmed' | 'canceled';
  eventId?: string;
  userId: string;
  date: string;
  lastSyncedDate?: string;
};

/**
 * Tipo per il risultato dettagliato della sincronizzazione.
 */
export type DetailedSyncResult = {
  added: Booking[];
  updated: Booking[];
  deleted: Booking[];
};

/**
 * Scambia il codice di autorizzazione per ottenere i token e li salva su Firestore.
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
 * Recupera tutti gli eventi attuali da Google Calendar.
 * Qui vengono presi gli eventi futuri da "oggi" in poi; adatta la query se necessario.
 */
export const fetchGoogleCalendarEvents = async (userId: string): Promise<any[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) throw new Error('Utente non trovato');
  const token = userDoc.data()?.googleCalendarToken;
  if (!token || !token.access_token) throw new Error('Token Google Calendar non trovato');

  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=2500&singleEvents=true`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      }
    }
  );
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`Errore durante il fetch degli eventi: ${JSON.stringify(errorBody)}`);
  }
  const data = await response.json();
  return data.items || [];
};

/**
 * Aggiunge un evento a Google Calendar.
 */
export const addToGoogleCalendar = async (
  userId: string,
  eventData: Booking
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error('Utente non trovato');
    const data = userDoc.data();
    const token = data?.googleCalendarToken;
    if (!token || !token.access_token) throw new Error('Token Google Calendar non trovato');

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
 * Aggiorna un evento esistente su Google Calendar.
 */
export const updateGoogleCalendarEvent = async (
  userId: string,
  eventId: string,
  eventData: Booking
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error('Utente non trovato');
    const data = userDoc.data();
    const token = data?.googleCalendarToken;
    if (!token || !token.access_token) throw new Error('Token Google Calendar non trovato');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
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
      throw new Error(`Errore durante l'aggiornamento dell'evento: ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Errore in updateGoogleCalendarEvent:', error);
    throw error;
  }
};

/**
 * Rimuove un evento da Google Calendar.
 */
export const removeFromGoogleCalendar = async (
  userId: string,
  eventId: string
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error('Utente non trovato');
    const data = userDoc.data();
    const token = data?.googleCalendarToken;
    if (!token || !token.access_token) throw new Error('Token Google Calendar non trovato');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.access_token}`
        }
      }
    );
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Errore durante la rimozione dell'evento: ${JSON.stringify(errorBody)}`);
    }
    return true;
  } catch (error) {
    console.error('Errore in removeFromGoogleCalendar:', error);
    throw error;
  }
};

/** 
 * Funzione di backoff per riprovare la rimozione se riceviamo rateLimitExceeded. 
 * Tenta fino a 5 volte con un ritardo esponenziale (1s, 2s, 4s...).
 */
async function removeEventWithBackoff(userId: string, eventId: string, attempt = 1): Promise<void> {
  try {
    await removeFromGoogleCalendar(userId, eventId);
  } catch (error: any) {
    // Controlliamo se è un rate limit
    if (
      attempt < 5 &&
      error.message?.includes('"code":403') &&
      error.message?.includes('"reason":"rateLimitExceeded"')
    ) {
      const delaySeconds = Math.pow(2, attempt - 1); // 1, 2, 4, 8, 16
      console.warn(
        `removeEventWithBackoff: rateLimitExceeded al tentativo ${attempt}, retry fra ${delaySeconds}s`
      );
      await new Promise((res) => setTimeout(res, delaySeconds * 1000));
      // Riproviamo incrementando il tentativo
      return removeEventWithBackoff(userId, eventId, attempt + 1);
    }
    // Altrimenti rilanciamo
    throw error;
  }
}

/**
 * Recupera le prenotazioni dalla collezione "bookings" di Firestore filtrando per userId.
 */
const getBookingsForUser = async (userId: string): Promise<Booking[]> => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(bookingsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const bookings: Booking[] = [];
  snapshot.forEach((docSnap) => {
    bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
  });
  return bookings;
};

/**
 * Sincronizza gli eventi di Google Calendar con i booking presenti in Firestore.
 * Se in Firestore esistono 45 prenotazioni e su GCal 46, elimina gli eventi in eccesso.
 * Inoltre, crea o aggiorna gli eventi in base alle differenze.
 */
export const syncAllBookingsToGoogleCalendar = async (userId: string): Promise<DetailedSyncResult> => {
  try {
    // 1) Recupera i booking da Firestore
    const bookings = await getBookingsForUser(userId);
    // 2) Recupera gli eventi attuali da Google Calendar
    const googleEvents = await fetchGoogleCalendarEvents(userId);
    // Costruisce una mappa degli eventi di GCal per id
    const gcalEventsMap = new Map<string, any>();
    googleEvents.forEach((ev) => {
      if (ev.id) {
        gcalEventsMap.set(ev.id, ev);
      }
    });

    const added: Booking[] = [];
    const updated: Booking[] = [];
    const deleted: Booking[] = [];

    // 3) Per ogni booking in Firestore
    for (const booking of bookings) {
      if (!booking.eventId) {
        // Booking non sincronizzato: crea l'evento su GCal
        await addToGoogleCalendar(userId, booking);
        added.push(booking);
      } else {
        // Se esiste un eventId, verifica se l'evento esiste su GCal
        const gcalEvent = gcalEventsMap.get(booking.eventId);
        if (!gcalEvent) {
          // L'evento non esiste più su GCal: ricrealo
          await addToGoogleCalendar(userId, booking);
          added.push(booking);
        } else {
          // L'evento esiste: rimuovilo dalla mappa
          gcalEventsMap.delete(booking.eventId);
          // Se il booking è stato modificato (es. la data è cambiata), aggiorna l'evento
          if (booking.lastSyncedDate !== booking.date) {
            try {
              await updateGoogleCalendarEvent(userId, booking.eventId, booking);
              updated.push(booking);
            } catch (err: any) {
              // Se l'evento non viene trovato (404), ricrealo
              if (err.message.includes('"code":404')) {
                await addToGoogleCalendar(userId, booking);
                added.push(booking);
              } else {
                throw err;
              }
            }
          }
        }
      }
    }

    // 4) Gli eventi rimasti nella mappa non corrispondono a nessun booking in Firestore: cancellali (con backoff)
    for (const eventId of gcalEventsMap.keys()) {
      try {
        // Usare la funzione di backoff
        await removeEventWithBackoff(userId, eventId);
        deleted.push({
          id: eventId,
          summary: 'Evento eliminato perché non presente in Firestore',
          startDateTime: '',
          endDateTime: '',
          status: 'canceled',
          userId,
          date: ''
        } as Booking);
      } catch (err) {
        // Se errore 404 lo ignoriamo, altrimenti log
        console.error('Errore in removeEventWithBackoff:', err);
      }
    }

    return { added, updated, deleted };
  } catch (error) {
    console.error('Errore in syncAllBookingsToGoogleCalendar:', error);
    throw error;
  }
};

/**
 * Genera link per aggiungere l'evento ai vari calendari.
 */
export const generateCalendarLinks = (eventData: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}) => {
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
  };
};
