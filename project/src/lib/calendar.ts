import { GOOGLE_CONFIG, CALENDAR_SETTINGS } from '../config/calendar';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Funzione per aggiungere un evento al calendario usando l'API REST
export const addToGoogleCalendar = async (
  userId: string,
  eventData: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }
) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData?.googleCalendarToken) {
      throw new Error('Token Google Calendar non trovato');
    }

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: CALENDAR_SETTINGS.timeZone
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: CALENDAR_SETTINGS.timeZone
      },
      location: eventData.location,
      reminders: {
        useDefault: true
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userData.googleCalendarToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error('Errore durante l\'aggiunta dell\'evento al calendario');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};

// Funzione per gestire il callback di autenticazione
export const handleGoogleCalendarCallback = async (code: string, userId: string) => {
  try {
    // Scambia il codice per i token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CONFIG.clientId,
        client_secret: GOOGLE_CONFIG.clientSecret,
        redirect_uri: GOOGLE_CONFIG.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Errore durante lo scambio del codice di autorizzazione');
    }

    const tokens = await tokenResponse.json();
    
    // Salva i token in Firestore
    await setDoc(doc(db, 'users', userId), {
      googleCalendarToken: tokens.access_token,
      googleCalendarRefreshToken: tokens.refresh_token,
      calendarConnected: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    throw error;
  }
};

// Funzione per iniziare il processo di autorizzazione
export const initiateGoogleAuth = () => {
  const scope = encodeURIComponent(GOOGLE_CONFIG.scopes.join(' '));
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CONFIG.clientId}&redirect_uri=${GOOGLE_CONFIG.redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  
  // Store the current URL to redirect back after auth
  sessionStorage.setItem('calendarReturnTo', window.location.pathname);
  
  // Redirect to Google auth
  window.location.href = authUrl;
};

// Genera link per aggiungere al calendario
export const generateCalendarLinks = (
  eventTitle: string,
  description: string,
  startTime: Date,
  endTime: Date,
  location?: string
) => {
  // Format dates for Google Calendar
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  // Google Calendar
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: description,
    location: location || '',
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    ctz: CALENDAR_SETTINGS.timeZone
  });
  
  // iCal format
  const iCalStart = format(startTime, "yyyyMMdd'T'HHmmss'Z'");
  const iCalEnd = format(endTime, "yyyyMMdd'T'HHmmss'Z'");
  const iCalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${iCalStart}`,
    `DTEND:${iCalEnd}`,
    `SUMMARY:${eventTitle}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\n');

  const iCalBlob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
  const iCalUrl = URL.createObjectURL(iCalBlob);
  
  return {
    google: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    ical: iCalUrl
  };
};