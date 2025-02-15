import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as functions from 'firebase-functions';

// Initialize MailerSend with API key
const mailersend = new MailerSend({
  apiKey: 'mlsn.21b7fc7fe686a319f21b7baf1ef1182e96e38f4525c87b3a512a45e997081789'
});

// Default sender configuration
const defaultSender = new Sender(
  'imagesoftwarecloud@gmail.com',
  'Carnevale Cinematografico'
);

interface EmailData {
  to: string;
  template: string;
  data?: Record<string, any>;
}

// Send email using MailerSend
export const sendEmail = async (options: EmailData): Promise<boolean> => {
  try {
    const { subject, html } = await getEmailTemplate(options.template, options.data);

    const recipients = [
      new Recipient(options.to)
    ];

    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    await mailersend.email.send(emailParams);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Get email template based on type
const getEmailTemplate = async (
  template: string,
  data?: Record<string, any>
): Promise<{ subject: string; html: string }> => {
  let subject = '';
  let content = '';

  switch (template) {
    case 'booking':
      subject = 'Conferma della prenotazione';
      content = `
        <p>Gentile ${data?.name},</p>
        <p>La tua prenotazione è stata confermata con successo!</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
          <p><strong>Data:</strong> ${data?.date}</p>
          <p><strong>Orario:</strong> ${data?.time}</p>
          <p><strong>Numero Ticket:</strong> ${data?.ticketNumber}</p>
        </div>
        <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
        <p>Ti aspettiamo per il tuo servizio fotografico!</p>
      `;
      break;

    case 'reminder':
      subject = 'Promemoria prenotazione';
      content = `
        <p>Gentile ${data?.name},</p>
        <p>Ti ricordiamo che hai una prenotazione per domani:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
          <p><strong>Data:</strong> ${data?.date}</p>
          <p><strong>Orario:</strong> ${data?.time}</p>
        </div>
        <p>Indirizzo: Via Quinto Orazio Flacco 5, Aversa</p>
        <p>Ti aspettiamo!</p>
      `;
      break;

    case 'expiring':
      const daysLeft = Math.ceil((new Date(data?.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      subject = 'Il tuo abbonamento sta per scadere';
      content = `
        <p>Il tuo abbonamento scadrà tra ${daysLeft} giorni.</p>
        <p>Per continuare ad utilizzare tutti i servizi, rinnova il tuo abbonamento.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://your-app.com/dashboard/subscription" 
             style="background-color: #D22B2B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Rinnova Ora
          </a>
        </div>
      `;
      break;

    case 'expired':
      subject = 'Il tuo abbonamento è scaduto';
      content = `
        <p>Il tuo abbonamento è scaduto.</p>
        <p>Per continuare ad utilizzare tutti i servizi, rinnova il tuo abbonamento.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://your-app.com/dashboard/subscription" 
             style="background-color: #D22B2B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Rinnova Ora
          </a>
        </div>
      `;
      break;

    case 'custom':
      subject = 'Notifica Abbonamento';
      content = `<p>${data?.message}</p>`;
      break;

    default:
      throw new Error('Invalid email template');
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D22B2B; text-align: center;">
        Carnevale Cinematografico
      </h1>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${content}
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666;">
        <p>© ${new Date().getFullYear()} Carnevale Cinematografico. Tutti i diritti riservati.</p>
      </div>
    </div>
  `;

  return { subject, html };
};