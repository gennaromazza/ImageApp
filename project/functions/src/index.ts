import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from './email';

admin.initializeApp();

// Cloud Function per l'invio delle email
export const sendEmailFunction = functions.https.onCall(async (data, context) => {
  // Verifica che l'utente sia autenticato
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utente deve essere autenticato'
    );
  }

  const { to, type, data: emailData } = data;

  if (!to || !type) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Parametri email non validi'
    );
  }

  try {
    const success = await sendEmail({
      to,
      template: type,
      data: emailData
    });

    // Log dell'invio email
    await admin.firestore().collection('email_logs').add({
      to,
      type,
      data: emailData,
      success,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth.uid,
      email: context.auth.token.email
    });

    return { success };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log dell'errore
    await admin.firestore().collection('email_logs').add({
      to,
      type,
      data: emailData,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth.uid,
      email: context.auth.token.email
    });

    throw new functions.https.HttpsError(
      'internal',
      'Errore nell\'invio dell\'email'
    );
  }
});

// Trigger per l'invio automatico delle email di promemoria
export const sendBookingReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const bookingsRef = admin.firestore().collection('bookings');
    const snapshot = await bookingsRef
      .where('booking_date', '==', tomorrowStr)
      .where('status', '==', 'confirmed')
      .get();

    const reminderPromises = snapshot.docs.map(async (doc) => {
      const booking = doc.data();
      
      try {
        await sendEmail({
          to: booking.email,
          template: 'reminder',
          data: {
            name: booking.name,
            date: booking.booking_date,
            time: booking.booking_time
          }
        });

        // Log del promemoria inviato
        await admin.firestore().collection('email_logs').add({
          type: 'reminder',
          bookingId: doc.id,
          success: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error(`Error sending reminder for booking ${doc.id}:`, error);
        
        // Log dell'errore
        await admin.firestore().collection('email_logs').add({
          type: 'reminder',
          bookingId: doc.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    await Promise.all(reminderPromises);
  });