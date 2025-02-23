import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactElement,
} from 'react';
import { MessageCircle, Smile } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Booking } from '../../types/booking';

/* -------------------------------------------------------------------------
 * 1) FUNZIONE getWhatsAppLink CORRETTA
 * ------------------------------------------------------------------------*/
function getWhatsAppLink(phone: string, message: string): string {
  // Usa encodeURIComponent per includere correttamente il testo nell’URL
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

/* -------------------------------------------------------------------------
 * 2) ALERT COMPONENTI (Alert / AlertTitle / AlertDescription)
 * ------------------------------------------------------------------------*/
type AlertVariant = 'default' | 'destructive';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

function Alert({
  variant = 'default',
  className,
  children,
  ...props
}: AlertProps) {
  const variantClasses =
    variant === 'destructive'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div
      className={`relative w-full rounded-lg border p-4 text-sm ${variantClasses} ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </div>
  );
}

function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`mb-1 font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    >
      {children}
    </h2>
  );
}

function AlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm opacity-90 ${className || ''}`} {...props}>
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------
 * 3) DIALOG COMPONENTI (Dialog / DialogTrigger / DialogContent / ...)
 * ------------------------------------------------------------------------*/
interface IDialogContext {
  open: boolean;
  setOpen: (value: boolean) => void;
}
const DialogContext = createContext<IDialogContext | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a <Dialog> parent');
  }
  return context;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const { setOpen } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      onClick: () => setOpen(true),
    });
  }

  return <button onClick={() => setOpen(true)}>{children}</button>;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open } = useDialogContext();
  if (!open) return null;

  return (
    <div
      className={`fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-2 text-center sm:text-left ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    >
      {children}
    </h2>
  );
}

function DialogDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-600 ${className || ''}`} {...props}>
      {children}
    </p>
  );
}

function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 flex justify-end space-x-2 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 4) BUTTON
 * ------------------------------------------------------------------------*/
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'primary';
  size?: 'default' | 'icon';
}

function Button({ variant, size, className, children, ...props }: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-2 ' +
    'focus:outline-none transition-colors';

  const stylesByVariant: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
    primary: 'bg-green-600 text-white hover:bg-green-700',
  };

  const variantClass = variant ? stylesByVariant[variant] || '' : stylesByVariant.default;

  return (
    <button className={`${baseClasses} ${variantClass} ${className || ''}`} {...props}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------
 * 5) TEXTAREA
 * ------------------------------------------------------------------------*/
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 ${
        className || ''
      }`}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------
 * 6) POPOVER (Popover / PopoverTrigger / PopoverContent) semplificato
 * ------------------------------------------------------------------------*/
interface IPopoverContext {
  open: boolean;
  setOpen: (value: boolean) => void;
}
const PopoverContext = createContext<IPopoverContext | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a <Popover> parent');
  }
  return context;
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  const { setOpen } = usePopoverContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      onClick: () => setOpen(true),
    });
  }

  return <button onClick={() => setOpen(true)}>{children}</button>;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PopoverContent({ className, children, ...props }: PopoverContentProps) {
  const { open, setOpen } = usePopoverContext();
  if (!open) return null;

  return (
    <div
      className={`absolute z-50 mt-2 rounded-md border bg-white p-2 shadow ${
        className || ''
      }`}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 7) CARD
 * ------------------------------------------------------------------------*/
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 shadow-sm ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 8) NOTIFYAPPWHTZ - COMPONENTE PRINCIPALE
 * ------------------------------------------------------------------------*/
interface BookingWithReminder extends Booking {
  reminder_sent?: boolean;
  reminder_sent_at?: any; // O Timestamp se preferisci
  message_sent?: string;
}

interface NotifyAppWhtzProps {
  booking: BookingWithReminder;
}

// Gruppi di emoji di esempio
type EmojiGroup = { [key: string]: string[] };
const EMOJI_GROUPS: EmojiGroup = {
  Saluti: ['👋', '🤝', '👍', '🙏'],
  Tempo: ['⏰', '📅', '⌚', '⏳'],
  Positivi: ['✨', '🌟', '💫', '🎉'],
  Servizi: ['💇‍♀️', '💅', '💆‍♀️', '👗'],
};

function NotifyAppWhtz({ booking }: NotifyAppWhtzProps): JSX.Element {
  const [sent, setSent] = useState<boolean>(!!booking.reminder_sent);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  const [message, setMessage] = useState<string>(
    `Ciao ${booking.firstName || 'Cliente'} 👋, ti ricordiamo il tuo appuntamento il ${formatDate(booking.booking_date)} ⏰ alle ${booking.booking_time}.`
  );
  

  /**
   * Inserisce un'emoji nel messaggio, rispettando la posizione del cursore
   */
  const insertEmoji = (emoji: string): void => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);
    setMessage(newMessage);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  /**
   * Funzione per aprire WhatsApp con il messaggio e aggiornare Firestore
   */
  const sendReminder = useCallback(async (): Promise<void> => {
    // Rimuoviamo il check su (sent) per consentire reinvio.
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!booking?.id || !booking?.phone) {
        throw new Error('Dati prenotazione incompleti o ID mancante.');
      }

      const whatsappLink = getWhatsAppLink(booking.phone, message);
      // Apri WhatsApp in una nuova scheda
      window.open(whatsappLink, '_blank');

      // Segna su Firestore come inviato
      await updateDoc(doc(db, 'bookings', booking.id), {
        reminder_sent: true,
        reminder_sent_at: serverTimestamp(),
        last_updated: serverTimestamp(),
        message_sent: message,
      });

      setSent(true);
      setIsOpen(false);
    } catch (err) {
      console.error('Errore nell\'invio del promemoria:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [booking, loading, message]);

  /**
   * Formatta il testo per l'anteprima, trasformando i link in <a>
   */
  const formatPreviewText = (text: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const textWithLinks = text.replace(
      urlRegex,
      '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return textWithLinks.replace(/\n/g, '<br>');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          // Non disabilitiamo più se sent === true, così puoi sempre reinviare
          className={`
            flex items-center gap-2 p-2 rounded transition-all
            ${
              loading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }
            text-white
          `}
        >
          <MessageCircle size={16} />
          {sent ? 'Reinvia' : 'Invia'}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Personalizza Messaggio</DialogTitle>
          <DialogDescription>
            Personalizza il messaggio prima dell'invio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Textarea
              id="message-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] pr-10"
              placeholder="Inserisci il tuo messaggio..."
            />

            {/* POPUP EMOJI */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                >
                  <Smile size={16} />
                </Button>
              </PopoverTrigger>
              <div className="relative">
                <PopoverContent className="w-64 p-2">
                  {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
                    <div key={group} className="mb-2">
                      <div className="text-sm font-medium mb-1">{group}</div>
                      <div className="flex flex-wrap gap-1">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => insertEmoji(emoji)}
                            className="hover:bg-gray-100 p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </PopoverContent>
              </div>
            </Popover>
          </div>

          {/* CARD ANTEPRIMA */}
          <Card className="bg-gray-50">
            <div className="text-sm font-medium mb-2">Anteprima messaggio:</div>
            <div
              className="bg-white p-3 rounded-lg shadow-sm"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              }}
              dangerouslySetInnerHTML={{
                __html: formatPreviewText(message),
              }}
            />
          </Card>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-0 mt-4">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Annulla
          </Button>
          <Button
            type="button"
            onClick={sendReminder}
            disabled={loading}
            className="relative"
          >
            {loading && <MessageCircle className="absolute left-2 animate-spin" size={16} />}
            {loading ? 'Invio in corso...' : 'Invia messaggio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NotifyAppWhtz;
