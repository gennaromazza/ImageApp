import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { EventSettings } from '../types/settings';
import type { IntroAnimationType } from '../types/animations';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'event-settings';

export interface EventSettings {
  id: string;
  eventName: string;
  countdownDate: string;
  showCountdown: boolean;
  bookingIntervals: number;
  maxBookingsPerDay: number;
  startTime: string;
  endTime: string;
  serviceTypes: Array<{
    id: string;
    name: string;
    enabled: boolean;
    duration: number;
    bookingStartDate: string;
    bookingEndDate: string;
    excludedDays: number[];
    excludedDates: string[];
  }>;
  breakTimes: Array<{
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bookingStatuses: Array<{
    id: string;
    name: string;
    color: string;
    enabled: boolean;
  }>;
  products: any[];
  company: {
    name: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    socialLinks: Record<string, string>;
  };
  animation: {
    enabled: boolean;
    title: string;
    subtitle: string;
    type: IntroAnimationType;
    ticketStampType: 'classic' | 'modern' | 'vintage';
  };
  social: {
    image: string;
    title: string;
    description: string;
    url: string;
  };
  ticketTemplate: {
    type: 'classic' | 'modern' | 'vintage';
    enabled: boolean;
  };
  whatsappTemplate: {
    header: string;
    productFormat: string;
    paymentFormat: string;
    footer: string;
  };
}

const DEFAULT_SETTINGS: EventSettings = {
  id: SETTINGS_DOC_ID,
  eventName: 'Carnevale Cinematografico',
  countdownDate: '2024-03-04T09:00:00',
  showCountdown: true,
  bookingIntervals: 30,
  maxBookingsPerDay: 20,
  startTime: '09:00',
  endTime: '18:00',
  serviceTypes: [
    { 
      id: 'carnival',
      name: 'Carnevale',
      enabled: true,
      duration: 30,
      bookingStartDate: '2024-03-04',
      bookingEndDate: '2024-03-31',
      excludedDays: [0], // Sunday
      excludedDates: []
    }
  ],
  breakTimes: [
    { start: '13:00', end: '14:00', enabled: true }
  ],
  bookingStatuses: [
    { id: 'pending', name: 'In attesa', color: '#FFA500', enabled: true },
    { id: 'confirmed', name: 'Confermato', color: '#10B981', enabled: true },
    { id: 'cancelled', name: 'Cancellato', color: '#EF4444', enabled: true }
  ],
  products: [],
  company: {
    name: 'Image Studio',
    logo: '',
    address: 'Via Quinto Orazio Flacco 5, Aversa',
    phone: '',
    email: '',
    website: '',
    socialLinks: {}
  },
  animation: {
    enabled: true,
    title: 'Carnevale 2025',
    subtitle: '3... 2... 1...',
    type: 'curtain',
    ticketStampType: 'classic'
  },
  social: {
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    title: 'Carnevale Cinematografico 2025',
    description: 'Prenota il tuo servizio fotografico per il Carnevale Cinematografico 2025',
    url: 'https://gennaromazzacane.it/carnival2025'
  },
  ticketTemplate: {
    type: 'classic',
    enabled: true
  },
  whatsappTemplate: {
    header: '*🎭 CARNEVALE CINEMATOGRAFICO*\n\n*👤 CLIENTE*\nNome: {firstName} {lastName}\nTicket: #{ticketNumber}\n\n*📝 PRODOTTI ORDINATI*',
    productFormat: '{index}. {productName}\n   Quantità: {quantity}\n   Prezzo: {price}\n   Totale: {total}\n',
    paymentFormat: '*💳 ACCONTI VERSATI*\n{index}. {date}\n   Metodo: {method}\n   Importo: {amount}\n',
    footer: '\n📍 {address}\n📞 Per assistenza: {phone}'
  }
};

// Get settings with cache
export const getEventSettings = async (): Promise<EventSettings> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    
    const settings = settingsDoc.data() as EventSettings;
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      company: {
        ...DEFAULT_SETTINGS.company,
        ...(settings.company || {})
      },
      whatsappTemplate: {
        ...DEFAULT_SETTINGS.whatsappTemplate,
        ...(settings.whatsappTemplate || {})
      }
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Update settings
export const updateEventSettings = async (settings: Partial<EventSettings>): Promise<void> => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, { ...settings, id: SETTINGS_DOC_ID }, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Subscribe to settings changes
export const subscribeToSettings = (callback: (settings: EventSettings) => void): (() => void) => {
  const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  
  const unsubscribe = onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      const settings = doc.data() as EventSettings;
      callback({
        ...DEFAULT_SETTINGS,
        ...settings,
        company: {
          ...DEFAULT_SETTINGS.company,
          ...(settings.company || {})
        },
        whatsappTemplate: {
          ...DEFAULT_SETTINGS.whatsappTemplate,
          ...(settings.whatsappTemplate || {})
        }
      });
    } else {
      callback(DEFAULT_SETTINGS);
    }
  }, (error) => {
    console.error('Error observing settings:', error);
  });

  return unsubscribe;
};