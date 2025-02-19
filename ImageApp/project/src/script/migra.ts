import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Definisci il nuovo stato predefinito (ad es. il primo stato configurato)
const newDefaultStatus = 'prenotato'; // sostituisci con il valore corretto

async function migratePendingBookings() {
  const bookingsRef = collection(db, 'bookings');
  const snapshot = await getDocs(bookingsRef);

  const pendingBookings = snapshot.docs.filter(doc => doc.data().status === 'pending');
  console.log(`Trovate ${pendingBookings.length} prenotazioni con stato "pending".`);

  for (const bookingDoc of pendingBookings) {
    const bookingRef = doc(db, 'bookings', bookingDoc.id);
    await updateDoc(bookingRef, { status: newDefaultStatus });
    console.log(`Aggiornata prenotazione ${bookingDoc.id} a ${newDefaultStatus}`);
  }

  console.log('Migrazione completata.');
}

migratePendingBookings().catch(console.error);
