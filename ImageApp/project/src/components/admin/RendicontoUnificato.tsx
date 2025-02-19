import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface UnifiedTransaction {
  id: string;
  date: Date;                                 // Data sempre presente
  type: 'income' | 'expense';
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  origin: 'order' | 'cassa';
  description: string;
  bookingId?: string;
}

const RendicontoUnificato: React.FC = () => {
  const [allMovements, setAllMovements] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUnifiedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Carica i dati da 'payment_history' (pagamenti ordini)
   * e 'transactions' (cassa), li trasforma in un formato unificato
   * e ordina il risultato per data.
   */
  const loadUnifiedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // 1) Carica i pagamenti (payment_history)
      const paymentHistorySnapshot = await getDocs(collection(db, 'payment_history'));
      const paymentsData: UnifiedTransaction[] = paymentHistorySnapshot.docs.map((doc) => {
        const d = doc.data();
        // Se non c'è d.date, assegniamo la data corrente come fallback:
        const dateField = d.date?.toDate() ?? new Date();

        return {
          id: doc.id,
          date: dateField,
          type: 'income',           // i pagamenti ordini sono entrate
          amount: d.amount ?? 0,
          method: d.method || 'other',
          origin: 'order',
          bookingId: d.bookingId,
          description: `Pagamento ordine: ${d.bookingId ?? ''}`
        };
      });

      // 2) Carica le transazioni di cassa
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const transactionsData: UnifiedTransaction[] = transactionsSnapshot.docs.map((doc) => {
        const t = doc.data();
        // Anche qui usiamo un fallback se t.date non esiste
        const dateField = t.date?.toDate() ?? new Date();

        return {
          id: doc.id,
          date: dateField,
          type: t.type || 'income', // se non specificato, di default 'income'
          amount: t.amount ?? 0,
          method: t.method || 'other',
          origin: 'cassa',
          description: t.description ?? ''
        };
      });

      // (Facoltativo) Carica "orders" se ti serve, ma non è obbligatorio per il rendiconto
      // const ordersSnapshot = await getDocs(collection(db, 'orders'));
      // ... se necessario, leggi e unisci dati degli ordini

      // 3) Unisci i due array
      const combined = [...paymentsData, ...transactionsData];

      // 4) Ordina per data, utilizzando date.getTime()
      //    Adesso "date" è sempre valorizzata, quindi non dà più errore
      combined.sort((a, b) => a.date.getTime() - b.date.getTime());

      setAllMovements(combined);
      setSuccessMessage('Dati caricati con successo!');
    } catch (err) {
      console.error('Errore nel caricamento dei dati unificati:', err);
      setError('Errore durante il caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Calcolo di alcune metriche di base
  const totalIncome = allMovements
    .filter((m) => m.type === 'income')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalExpense = allMovements
    .filter((m) => m.type === 'expense')
    .reduce((acc, m) => acc + m.amount, 0);

  const saldoNetto = totalIncome - totalExpense;

  // Entrate da ordini (origin = 'order')
  const totalOrdini = allMovements
    .filter((m) => m.origin === 'order' && m.type === 'income')
    .reduce((acc, m) => acc + m.amount, 0);

  // Entrate / Uscite di cassa (origin = 'cassa')
  const totalCassaEntrate = allMovements
    .filter((m) => m.origin === 'cassa' && m.type === 'income')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalCassaUscite = allMovements
    .filter((m) => m.origin === 'cassa' && m.type === 'expense')
    .reduce((acc, m) => acc + m.amount, 0);

  return (
    <div className="space-y-6">
      {/* Messaggi di errore o successo */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2 text-red-400 transition duration-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-2 text-green-500 transition duration-300">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {/* Spinner di caricamento */}
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* --- Riepilogo metriche --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Entrate Totali
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{totalIncome.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Uscite Totali
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{totalExpense.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Saldo Netto
              </h3>
              <p
                className={`text-2xl font-bold ${
                  saldoNetto >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                €{saldoNetto.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Totale da Ordini (Entrate)
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{totalOrdini.toFixed(2)}
              </p>
            </div>
          </div>

          {/* --- Dettaglio cassa --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Entrate di Cassa
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{totalCassaEntrate.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Uscite di Cassa
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{totalCassaUscite.toFixed(2)}
              </p>
            </div>
          </div>

          {/* --- Tabella dei movimenti unificati --- */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Elenco Movimenti (Ordini + Cassa)
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
                  {allMovements.map((m) => {
                    const dateString = m.date?.toLocaleString() ?? '';
                    const isIncome = m.type === 'income';

                    return (
                      <tr
                        key={m.id}
                        className="border-b last:border-none dark:border-gray-700 text-gray-900 dark:text-white"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          {dateString}
                        </td>
                        <td className="px-4 py-2">
                          {m.description}
                        </td>
                        <td className="px-4 py-2 capitalize">
                          {m.origin}
                        </td>
                        <td className="px-4 py-2">
                          {isIncome ? (
                            <span className="text-green-600 dark:text-green-400">
                              Entrata
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">
                              Uscita
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {m.method}
                        </td>
                        <td className="px-4 py-2">
                          {isIncome ? '+' : '-'}€{m.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {allMovements.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-center text-gray-500 dark:text-gray-400"
                      >
                        Nessun movimento presente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RendicontoUnificato;
