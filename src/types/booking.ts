// src/types/booking.ts

export interface BookingNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}
export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  notes?: string; // Note attuali (opzionali)
  notesHistory?: Array<{ // Storico delle note (opzionale)
    content: string;
    timestamp: string;
  }>;
  updated_at?: string;
  // Altre proprietà esistenti...
}
export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  ticket_number: string;
  status: string;
  created_at: string;
  notes?: string;
  photoCount?: number;
  hasNewSelection?: boolean; // <--- Aggiunta qui
}
