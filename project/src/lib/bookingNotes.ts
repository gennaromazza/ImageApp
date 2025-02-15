import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { 
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc
} from 'firebase/firestore';
import type { BookingNote } from '../types/booking';

export const addBookingNote = async (bookingId: string, content: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const notesRef = collection(db, 'bookings', bookingId, 'notes');
    await addDoc(notesRef, {
      content,
      createdBy: auth.currentUser.email,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

export const deleteBookingNote = async (bookingId: string, noteId: string): Promise<void> => {
  try {
    const noteRef = doc(db, 'bookings', bookingId, 'notes', noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const useBookingNotes = (bookingId: string) => {
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notesRef = collection(db, 'bookings', bookingId, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as BookingNote[];
        setNotes(notesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching notes:', error);
        setError('Errore nel caricamento delle note');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId]);

  return { notes, loading, error };
};