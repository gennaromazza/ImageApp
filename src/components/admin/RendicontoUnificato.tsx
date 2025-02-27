import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Order, PaymentRecord } from '../../lib/products';

import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
// import type { Order } from '../../lib/firebase'; // oppure da '../../lib/products' se definito lì

interface UnifiedTransaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  origin: 'order' | 'cassa';
  description: string;
  orderId?: string;
  bookingId?: string;
  firstName?: string;
  lastName?: string;
  ticket?: string;
}

const ITEMS_PER_PAGE = 10;

const RendicontoUnificato: React.FC = () => {
  const [allMovements, setAllMovements] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  // Stati per ricerca e filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'order' | 'cassa'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'cash' | 'card' | 'transfer' | 'other'>('all');

  useEffect(() => {
    loadUnifiedData();
  }, []);

  const loadUnifiedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // 1) Carica i pagamenti (payment_history)
      const paymentHistorySnapshot = await getDocs(collection(db, 'payment_history'));
      const paymentsData: UnifiedTransaction[] = await Promise.all(
        paymentHistorySnapshot.docs.map(async (docSnap) => {
          const d = docSnap.data();
          const dateField = d.date?.toDate() ?? new Date();
          let firstName = '';
          let lastName = '';
          let ticket = '';
          let bookingId = '';

          // Se esiste un orderId, recupera l'ordine e poi la prenotazione
          if (d.orderId) {
            const orderRef = doc(db, 'orders', d.orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
              const orderData = orderSnap.data();
              if (orderData.bookingId) {
                bookingId = orderData.bookingId;
                const bookingRef = doc(db, 'bookings', bookingId);
                const bookingSnap = await getDoc(bookingRef);
                if (bookingSnap.exists()) {
                  const bookingData = bookingSnap.data();
                  firstName = bookingData.firstName ?? '';
                  lastName = bookingData.lastName ?? '';
                  ticket = bookingData.ticket_number ?? '';
                }
              }
            }
          }

          return {
            id: docSnap.id,
            date: dateField,
            type: 'income', // I pagamenti degli ordini sono entrate
            amount: d.amount ?? 0,
            method: d.method || 'other',
            origin: 'order',
            orderId: d.orderId || '',
            bookingId,
            firstName,
            lastName,
            ticket,
            description:
              firstName && lastName && ticket
                ? `${firstName} ${lastName} (Ticket: ${ticket})`
                : 'Pagamento ordine: ' + (d.orderId ?? '')
          } as UnifiedTransaction;
        })
      );

      // 2) Carica le transazioni di cassa
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const transactionsData: UnifiedTransaction[] = transactionsSnapshot.docs.map((docSnap) => {
        const t = docSnap.data();
        const dateField = t.date?.toDate() ?? new Date();
        return {
          id: docSnap.id,
          date: dateField,
          type: t.type || 'income',
          amount: t.amount ?? 0,
          method: t.method || 'other',
          origin: 'cassa',
          description: t.description ?? ''
        };
      });

      // 3) Unisci e ordina per data (dal più vecchio al più recente)
      const combined = [...paymentsData, ...transactionsData];
      combined.sort((a, b) => b.date.getTime() - a.date.getTime());
      setAllMovements(combined);
      setSuccessMessage('Dati caricati con successo!');
      setCurrentPage(0);

      // 4) Carica gli orders per calcolare gli "Importi in Sospeso"
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Order[];
      const pending = ordersData.reduce((sum, order) => sum + (order.balance || 0), 0);
      setPendingAmount(pending);
    } catch (err) {
      console.error('Errore nel caricamento dei dati unificati:', err);
      setError('Errore durante il caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Calcolo metriche unificate
  const totalIncome = allMovements.filter(m => m.type === 'income').reduce((acc, m) => acc + m.amount, 0);
  const totalExpense = allMovements.filter(m => m.type === 'expense').reduce((acc, m) => acc + m.amount, 0);
  const saldoNetto = totalIncome - totalExpense;
  const totalOrdersIncome = allMovements.filter(m => m.origin === 'order' && m.type === 'income').reduce((acc, m) => acc + m.amount, 0);

  // Funzione per applicare filtri e ricerca
  const applyFilters = (): UnifiedTransaction[] => {
    return allMovements.filter((mov) => {
      const searchLower = searchQuery.toLowerCase();
      const combinedString = [mov.description, mov.firstName, mov.lastName, mov.ticket]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (searchLower && !combinedString.includes(searchLower)) return false;
      if (filterType !== 'all' && mov.type !== filterType) return false;
      if (filterOrigin !== 'all' && mov.origin !== filterOrigin) return false;
      if (filterMethod !== 'all' && mov.method !== filterMethod) return false;
      return true;
    });
  };

  const filteredMovements = applyFilters();
  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const paginatedMovements = filteredMovements.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filterType, filterOrigin, filterMethod]);

  return (
    <div className="space-y-6">
      {/* Feedback visivo */}
      {error && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-600 transition duration-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-600 transition duration-300">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Riepilogo metriche */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-sm font-medium text-white">Entrate Totali</h3>
    <p className="text-2xl font-bold text-white">€{totalIncome.toFixed(2)}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-sm font-medium text-white">Uscite Totali</h3>
    <p className="text-2xl font-bold text-red-500">€{totalExpense.toFixed(2)}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-sm font-medium text-white">Saldo Netto</h3>
    <p className={`text-2xl font-bold ${saldoNetto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      €{saldoNetto.toFixed(2)}
    </p>
  </div>
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-sm font-medium text-white">Totale Ordini (Entrate)</h3>
    <p className="text-2xl font-bold text-white">€{totalOrdersIncome.toFixed(2)}</p>
  </div>
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-sm font-medium text-white">Importi in Sospeso</h3>
    <p className="text-2xl font-bold text-white">€{pendingAmount.toFixed(2)}</p>
  </div>
</div>


          {/* Barra di ricerca e filtri */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Cerca
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                    placeholder="Cerca per descrizione, nome, cognome o ticket..."
                  />
                  <Search className="absolute left-2 top-2 text-gray-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tutti</option>
                  <option value="income">Entrata</option>
                  <option value="expense">Uscita</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Origine
                </label>
                <select
                  value={filterOrigin}
                  onChange={(e) => setFilterOrigin(e.target.value as 'all' | 'order' | 'cassa')}
                  className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tutte</option>
                  <option value="order">Ordini</option>
                  <option value="cassa">Cassa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Metodo
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) =>
                    setFilterMethod(e.target.value as 'all' | 'cash' | 'card' | 'transfer' | 'other')
                  }
                  className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tutti</option>
                  <option value="cash">Contanti</option>
                  <option value="card">Carta</option>
                  <option value="transfer">Bonifico</option>
                  <option value="other">Altro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabella con paginazione */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Elenco Movimenti (Filtrati)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Descrizione</th>
                    <th className="px-4 py-2">Origine</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Metodo</th>
                    <th className="px-4 py-2">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMovements.map((m) => {
                    const dateString = m.date.toLocaleString();
                    const isIncome = m.type === 'income';
                    return (
                      <tr
                        key={m.id}
                        className="border-b last:border-none dark:border-gray-700 text-gray-900 dark:text-white"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">{dateString}</td>
                        <td className="px-4 py-2">
                          {m.origin === 'order'
                            ? (m.firstName && m.lastName && m.ticket
                                ? `${m.firstName} ${m.lastName} (Ticket: ${m.ticket})`
                                : m.description)
                            : m.description}
                        </td>
                        <td className="px-4 py-2 capitalize">{m.origin}</td>
                        <td className="px-4 py-2">
                          {isIncome ? (
                            <span className="text-green-600 dark:text-green-400">Entrata</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">Uscita</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{m.method}</td>
                        <td className="px-4 py-2">
                          {isIncome ? '+' : '-'}€{m.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedMovements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">
                        Nessun movimento presente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Precedente
              </button>
              <span>
                Pagina {currentPage + 1} di {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RendicontoUnificato;
