import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  runTransaction,
  getFirestore,
  Transaction
} from 'firebase/firestore';

import { db } from './firebase';
import type { Product } from '../types/settings';


export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  // Aggiunte per prodotto personalizzato
  customName?: string;
  customDescription?: string;
}


export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes?: string;
}

export interface Order {
  id: string;
  bookingId: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid';
  paymentDate?: Date;
  notes?: string;
}
export const deleteOrderWithPayments = async (orderId: string): Promise<void> => {
  try {
    // Crea un batch per eseguire eliminazioni multiple
    const batch = writeBatch(db);

    // Trova tutti i pagamenti associati a questo ordine
    const paymentHistoryRef = collection(db, 'payment_history');
    const q = query(paymentHistoryRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);

    // Aggiunge le eliminazioni al batch
    snapshot.docs.forEach((paymentDoc) => {
      batch.delete(paymentDoc.ref);
    });

    // Aggiunge l'eliminazione dell'ordine al batch
    const orderRef = doc(db, 'orders', orderId);
    batch.delete(orderRef);

    // Esegue tutte le eliminazioni in un'unica operazione
    await batch.commit();
  } catch (error) {
    console.error("Errore nella cancellazione dell'ordine e dei pagamenti:", error);
    throw error;
  }
};
// Create a new order
export const createOrder = async (bookingId: string, items: OrderItem[]): Promise<Order> => {
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const orderData = {
    bookingId,
    items,
    totalAmount,
    paidAmount: 0,
    balance: totalAmount,
    status: 'pending' as const,
    createdAt: serverTimestamp()
  };

  try {
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    return { id: orderRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update an existing order
export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Record a payment
export const recordPayment = async (
  orderId: string, 
  amount: number, 
  method: PaymentMethod,
  notes?: string
): Promise<void> => {
  try {
    // Get the current order
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordine non trovato');
    }

    const order = orderDoc.data() as Order;
    const newPaidAmount = (order.paidAmount || 0) + amount;
    const newBalance = order.totalAmount - newPaidAmount;
    const status = newBalance <= 0 ? 'paid' : newBalance < order.totalAmount ? 'partial' : 'pending';

    // Create payment record
    const paymentRecord = {
      orderId,
      amount,
      method,
      notes,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    // Add payment to history
    await addDoc(collection(db, 'payment_history'), paymentRecord);

    // Update order
    await updateDoc(orderRef, {
      paidAmount: newPaidAmount,
      balance: newBalance,
      status,
      paymentDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const deletePayment = async (orderId: string, paymentId: string): Promise<void> => {
  try {
    const dbRef = getFirestore();

    await runTransaction(dbRef, async (transaction: Transaction) => {
      // 1. Ottieni il documento del pagamento
      const paymentRef = doc(dbRef, 'payment_history', paymentId);
      const paymentSnap = await transaction.get(paymentRef);

      if (!paymentSnap.exists()) {
        throw new Error('Pagamento non trovato');
      }

      const paymentData = paymentSnap.data();

      // 2. Ottieni l’ordine associato
      const orderRef = doc(dbRef, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Ordine non trovato');
      }

      const orderData = orderSnap.data() as Order;

      // 3. Calcola i nuovi valori
      const newPaidAmount = (orderData.paidAmount || 0) - paymentData.amount;
      const newBalance = (orderData.totalAmount || 0) - newPaidAmount;
      const newStatus =
        newPaidAmount === 0
          ? 'pending'
          : newPaidAmount < (orderData.totalAmount || 0)
          ? 'partial'
          : 'paid';

      // 4. Elimina il pagamento
      transaction.delete(paymentRef);

      // 5. Se l'ordine non ha più prodotti né pagamenti, elimina l'ordine
      if (newPaidAmount === 0 && (!orderData.items || orderData.items.length === 0)) {
        transaction.delete(orderRef);
      } else {
        // Altrimenti, aggiorna l'ordine con i nuovi valori
        transaction.update(orderRef, {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus
        });
      }
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};



// Get payment history
export const getPaymentHistory = async (orderId: string): Promise<PaymentRecord[]> => {
  try {
    // Prima verifica che l'ordine esista
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      throw new Error('Ordine non trovato');
    }

    const paymentHistoryRef = collection(db, 'payment_history');
    const q = query(paymentHistoryRef, where('orderId', '==', orderId));
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as PaymentRecord[];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Ritorna un array vuoto in caso di errore di permessi
      // Questo evita che l'app si blocchi se l'utente non ha accesso
      return [];
    }
  } catch (error) {
    console.error('Error checking order:', error);
    return [];
  }
};

// Generate WhatsApp receipt
export const generateWhatsAppReceipt = async (
  order: Order, 
  booking: any, 
  products: Product[],
  settings: any
): Promise<string> => {
  try {
    // Use template from settings or fallback to defaults
    const template = settings?.whatsappTemplate || {
      header: '*🎭 CARNEVALE CINEMATOGRAFICO*\n\n*👤 CLIENTE*\nNome: {firstName} {lastName}\nTicket: #{ticketNumber}\n\n*📝 PRODOTTI ORDINATI*\n',
      productFormat: '{index}. {productName}\n   Quantità: {quantity}\n   Prezzo: €{price}\n   Totale: €{total}\n',
      paymentFormat: '{index}. {date}\n   Metodo: {method}\n   Importo: €{amount}\n',
      footer: '\n📍 {address}\n📞 Per assistenza: {phone}'
    };

    // Build message using template
    let message = template.header
      .replace('{firstName}', booking.firstName || '')
      .replace('{lastName}', booking.lastName || '')
      .replace('{ticketNumber}', booking.ticket_number || '');

    // Add products section
    if (order.items.length > 0) {
      order.items.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          message += template.productFormat
            .replace('{index}', (index + 1).toString())
            .replace('{productName}', product.name)
            .replace('{quantity}', item.quantity.toString())
            .replace('{price}', item.price.toFixed(2))
            .replace('{total}', (item.price * item.quantity).toFixed(2));
        }
      });

      // Add total amount
      message += `\n*💰 TOTALE ORDINE:* €${order.totalAmount.toFixed(2)}`;
    }

    // Add payments section
    try {
      const payments = await getPaymentHistory(order.id);
      if (payments.length > 0) {
        message += '\n\n*💳 ACCONTI VERSATI*\n';
        payments.forEach((payment, index) => {
          message += template.paymentFormat
            .replace('{index}', (index + 1).toString())
            .replace('{date}', payment.date.toLocaleDateString())
            .replace('{method}', getPaymentMethodLabel(payment.method))
            .replace('{amount}', payment.amount.toFixed(2));
        });

        // Add remaining balance if any
        if (order.balance > 0) {
          message += `\n*🔸 SALDO RIMANENTE:* €${order.balance.toFixed(2)}`;
        }
      }
    } catch (error) {
      console.error('Error adding payment history to receipt:', error);
      // Continue without payment history if there's an error
    }

    // Add footer with business info
    message += template.footer
      .replace('{address}', settings?.company?.address || 'Via Quinto Orazio Flacco 5, Aversa')
      .replace('{phone}', settings?.company?.phone || '');

    // Clean phone number for WhatsApp
    const cleanPhone = booking.phone.replace(/\D/g, '');
    return `https://wa.me/39${cleanPhone}?text=${encodeURIComponent(message)}`;
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw new Error('Errore nella generazione della ricevuta WhatsApp');
  }
};

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash': return 'Contanti';
    case 'card': return 'Carta';
    case 'transfer': return 'Bonifico';
    default: return method;
  }
};