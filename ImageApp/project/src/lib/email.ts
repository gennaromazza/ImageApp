import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Supported notification types
export type NotificationType = 
  | 'welcome'           // New user welcome
  | 'booking'           // Booking confirmation
  | 'reminder'          // Booking reminder
  | 'subscription'      // Subscription info
  | 'custom';           // Custom notification

interface EmailOptions {
  to: string;
  type: NotificationType;
  data?: {
    name?: string;
    date?: string;
    time?: string;
    message?: string;
    ticketNumber?: string;
    endDate?: Date;
  };
}

// Main email sending function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    console.log('Preparing email:', {
      to: options.to,
      type: options.type,
      data: options.data
    });

    // Get email template based on type
    const template = getEmailTemplate(options.type, options.data);

    // Validate template
    if (!template.subject || !template.html) {
      throw new Error('Email template generation failed');
    }

    console.log('Email template generated:', {
      subject: template.subject,
      htmlLength: template.html.length
    });

    // Call Firebase Function to send email
    const sendEmailFn = httpsCallable(functions, 'sendEmailFunction');
    
    const result = await sendEmailFn({
      to: options.to,
      type: options.type,
      data: {
        ...options.data,
        subject: template.subject,
        html: template.html,
        text: template.text
      }
    });

    const success = (result.data as any).success;
    console.log('Email function result:', result.data);

    // Log the email attempt
    try {
      await addDoc(collection(db, 'email_logs'), {
        to: options.to,
        type: options.type,
        data: options.data,
        success,
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.error('Error logging email:', logError);
      // Don't throw here - we still want to return the email sending result
    }

    return success;
  } catch (error) {
    console.error('Error in sendEmail:', error instanceof Error ? error.message : 'Unknown error');
    
    // Log the error
    try {
      await addDoc(collection(db, 'email_logs'), {
        to: options.to,
        type: options.type,
        data: options.data,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.error('Error logging email failure:', logError);
    }

    throw error;
  }
};

// Helper function to get email template
const getEmailTemplate = (type: NotificationType, data?: any) => {
  try {
    const baseTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #D22B2B; text-align: center;">Carnevale Cinematografico</h1>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          {{content}}
        </div>
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} Carnevale Cinematografico. Tutti i diritti riservati.</p>
        </div>
      </div>
    `;

    let content = '';
    let subject = '';
    let text = ''; // Plain text version

    switch (type) {
      case 'welcome':
        subject = 'Benvenuto in Carnevale Cinematografico';
        content = `
          <p>Gentile ${data?.name || 'Utente'},</p>
          <p>Benvenuto in Carnevale Cinematografico! Siamo lieti di averti con noi.</p>
          <p>Da ora potrai gestire le tue prenotazioni e accedere a tutti i nostri servizi.</p>
        `;
        text = `
          Gentile ${data?.name || 'Utente'},
          
          Benvenuto in Carnevale Cinematografico! Siamo lieti di averti con noi.
          Da ora potrai gestire le tue prenotazioni e accedere a tutti i nostri servizi.
        `;
        break;

      case 'booking':
        if (!data?.name || !data?.date || !data?.time || !data?.ticketNumber) {
          throw new Error('Missing required booking data');
        }
        subject = 'Conferma della prenotazione';
        content = `
          <p>Gentile ${data.name},</p>
          <p>La tua prenotazione è stata confermata con successo!</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
            <p><strong>Data:</strong> ${data.date}</p>
            <p><strong>Orario:</strong> ${data.time}</p>
            <p><strong>Numero Ticket:</strong> ${data.ticketNumber}</p>
          </div>
          <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
          <p>Ti aspettiamo per il tuo servizio fotografico!</p>
        `;
        text = `
          Gentile ${data.name},
          
          La tua prenotazione è stata confermata con successo!
          
          Data: ${data.date}
          Orario: ${data.time}
          Numero Ticket: ${data.ticketNumber}
          
          Indirizzo: Via Quinto Orazio Flacco 5, Aversa
          
          Ti aspettiamo per il tuo servizio fotografico!
        `;
        break;

      case 'reminder':
        if (!data?.name || !data?.date || !data?.time) {
          throw new Error('Missing required reminder data');
        }
        subject = 'Promemoria prenotazione';
        content = `
          <p>Gentile ${data.name},</p>
          <p>Ti ricordiamo che hai una prenotazione per domani:</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
            <p><strong>Data:</strong> ${data.date}</p>
            <p><strong>Orario:</strong> ${data.time}</p>
          </div>
          <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
          <p>Ti aspettiamo!</p>
        `;
        text = `
          Gentile ${data.name},
          
          Ti ricordiamo che hai una prenotazione per domani:
          
          Data: ${data.date}
          Orario: ${data.time}
          
          Indirizzo: Via Quinto Orazio Flacco 5, Aversa
          
          Ti aspettiamo!
        `;
        break;

      case 'subscription':
        subject = 'Informazioni abbonamento';
        if (data?.endDate) {
          const endDate = new Date(data.endDate);
          if (isNaN(endDate.getTime())) {
            throw new Error('Invalid subscription end date');
          }
          content = `
            <p>Il tuo abbonamento scadrà il ${endDate.toLocaleDateString('it-IT')}.</p>
            <p>Per continuare ad utilizzare tutti i servizi, rinnova il tuo abbonamento.</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://carnevale-cinematografico.web.app/profile/subscription" 
                 style="background-color: #D22B2B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Rinnova Ora
              </a>
            </div>
          `;
          text = `
            Il tuo abbonamento scadrà il ${endDate.toLocaleDateString('it-IT')}.
            Per continuare ad utilizzare tutti i servizi, rinnova il tuo abbonamento.
            
            Rinnova ora: https://carnevale-cinematografico.web.app/profile/subscription
          `;
        } else {
          content = data?.message || 'Controlla il tuo abbonamento.';
          text = data?.message || 'Controlla il tuo abbonamento.';
        }
        break;

      case 'custom':
      default:
        subject = 'Notifica da Carnevale Cinematografico';
        content = `<p>${data?.message || 'Nessun messaggio'}</p>`;
        text = data?.message || 'Nessun messaggio';
        break;
    }

    return {
      subject,
      html: baseTemplate.replace('{{content}}', content),
      text: text.trim().replace(/\n\s+/g, '\n')
    };
  } catch (error) {
    console.error('Error generating email template:', error);
    throw error;
  }
};

// Helper functions for common email types
export const sendWelcomeEmail = async (to: string, name: string): Promise<boolean> => {
  return sendEmail({
    to,
    type: 'welcome',
    data: { name }
  });
};

export const sendBookingConfirmation = async (
  to: string, 
  name: string,
  date: string,
  time: string,
  ticketNumber: string
): Promise<boolean> => {
  return sendEmail({
    to,
    type: 'booking',
    data: { name, date, time, ticketNumber }
  });
};

export const sendSubscriptionNotification = async (
  to: string,
  options: {
    type: 'expiring' | 'expired' | 'extension' | 'custom';
    endDate?: Date;
    message?: string;
  }
): Promise<boolean> => {
  return sendEmail({
    to,
    type: 'subscription',
    data: {
      endDate: options.endDate,
      message: options.message
    }
  });
};