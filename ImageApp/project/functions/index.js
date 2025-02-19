const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Initialize MailerSend with API key from environment
const mailersend = new MailerSend({
  apiKey: functions.config().mailersend.key
});

// Default sender configuration
const defaultSender = new Sender(
  'imagesoftwarecloud@gmail.com',
  'Carnevale Cinematografico'
);

exports.sendEmailFunction = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Wrap function in CORS middleware
    return new Promise((resolve, reject) => {
      cors(context.rawRequest, context.rawResponse, async () => {
        try {
          // Validate input data
          if (!data.to || !data.data?.subject || !data.data?.html) {
            throw new functions.https.HttpsError(
              'invalid-argument',
              'Missing required email data'
            );
          }

          // Create recipients list
          const recipients = [
            new Recipient(data.to)
          ];

          // Create email params
          const emailParams = new EmailParams()
            .setFrom(defaultSender)
            .setTo(recipients)
            .setSubject(data.data.subject)
            .setHtml(data.data.html)
            .setText(data.data.text || '');

          // Send email
          const response = await mailersend.email.send(emailParams);

          // Log success
          console.log('Email sent successfully:', response);

          resolve({ success: true, messageId: response.headers['x-message-id'] });
        } catch (error) {
          console.error('Error sending email:', error);
          
          reject(new functions.https.HttpsError(
            'internal',
            'Error sending email',
            error
          ));
        }
      });
    });
  });

// Trigger email on new booking
exports.onBookingCreated = functions
  .region('europe-west1')
  .firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    
    try {
      const recipients = [
        new Recipient(booking.email)
      ];

      const emailParams = new EmailParams()
        .setFrom(defaultSender)
        .setTo(recipients)
        .setSubject('Conferma della prenotazione')
        .setHtml(`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #D22B2B; text-align: center;">Conferma della prenotazione</h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Gentile ${booking.name},</p>
              <p>La tua prenotazione è stata confermata con successo!</p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
                <p><strong>Data:</strong> ${booking.booking_date}</p>
                <p><strong>Orario:</strong> ${booking.booking_time}</p>
                <p><strong>Numero Ticket:</strong> ${booking.ticket_number}</p>
              </div>
              
              <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
              
              <p style="margin-top: 20px;">
                Ti aspettiamo per il tuo servizio fotografico!
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
              <p>Carnevale Cinematografico</p>
            </div>
          </div>
        `);

      await mailersend.email.send(emailParams);
      console.log('Booking confirmation email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      return { success: false, error: error.message };
    }
  });