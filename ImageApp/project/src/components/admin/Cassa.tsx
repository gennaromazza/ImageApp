import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date; // convertito con .toDate() dopo il fetch
  method: 'cash' | 'card' | 'transfer';
}

// Numero di transazioni per “pagina”
const PAGE_SIZE = 5;

const Cassa = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    amount: 0,
    description: '',
    method: 'cash',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stato di caricamento iniziale (pagina 1)
  const [isLoading, setIsLoading] = useState(true);
  // Caricamento delle pagine successive
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Riferimento al “lastDoc” per paginazione
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  // Se abbiamo finito i dati di oggi
  const [noMore, setNoMore] = useState(false);

  // Stato di submit del form
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato per la transazione da editare
  const [editId, setEditId] = useState<string | null>(null);
  // Dati transazione in fase di modifica
  const [editTransaction, setEditTransaction] = useState<Partial<Transaction> | null>(null);
  // Per segnalare se stiamo salvando la modifica
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  /**
   * Carica la prima “pagina” di transazioni
   */
  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setNoMore(false);

      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('date', '>=', new Date(new Date().setHours(0, 0, 0, 0))),
        orderBy('date', 'asc'),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setTransactions([]);
        setNoMore(true);
      } else {
        if (snapshot.docs.length < PAGE_SIZE) {
          setNoMore(true);
        }
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        setLastDoc(lastVisible);

        const transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaction, 'id' | 'date'>),
          date: doc.data().date?.toDate(),
        })) as Transaction[];

        setTransactions(transactionsData);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Errore nel caricamento delle transazioni');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carica la “pagina” successiva
   */
  const loadMoreTransactions = async () => {
    try {
      if (noMore || !lastDoc) return;

      setIsLoadingMore(true);

      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('date', '>=', new Date(new Date().setHours(0, 0, 0, 0))),
        orderBy('date', 'asc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        if (snapshot.docs.length < PAGE_SIZE) {
          setNoMore(true);
        }
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        setLastDoc(lastVisible);

        const newTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaction, 'id' | 'date'>),
          date: doc.data().date?.toDate(),
        })) as Transaction[];

        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setNoMore(true);
      }
    } catch (err) {
      console.error('Error loading more transactions:', err);
      setError('Errore nel caricamento di ulteriori transazioni');
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Inserimento di una nuova transazione
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newTransaction.amount || !newTransaction.description) {
      setError('Compila tutti i campi richiesti');
      return;
    }

    try {
      setIsSubmitting(true);
      const transactionData = {
        ...newTransaction,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      setSuccessMessage('Transazione salvata con successo!');

      // Reset dei campi
      setNewTransaction({
        type: 'income',
        amount: 0,
        description: '',
        method: 'cash',
      });

      // Ricarica la prima pagina aggiornata
      loadTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Errore nel salvare la transazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cancellazione di un record
   */
  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setSuccessMessage('Transazione eliminata con successo!');
      // Ricarichiamo la pagina per vedere i dati aggiornati
      loadTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Errore nella cancellazione della transazione');
    }
  };

  /**
   * Avvia modifica di una transazione
   */
  const handleStartEdit = (transaction: Transaction) => {
    setEditId(transaction.id || null);
    // Cloniamo i campi attuali in uno stato di “editTransaction”
    setEditTransaction({ ...transaction });
  };

  /**
   * Annulla modifica
   */
  const handleCancelEdit = () => {
    setEditId(null);
    setEditTransaction(null);
    setIsEditing(false);
  };

  /**
   * Salva modifica su Firestore
   */
  const handleSaveEdit = async () => {
    if (!editId || !editTransaction) return;
    // Controlli di validità minimi (es. campi richiesti)
    if (!editTransaction.amount || !editTransaction.description) {
      setError('Compila tutti i campi per la modifica');
      return;
    }

    try {
      setIsEditing(true);

      // Creiamo un oggetto con i campi da aggiornare
      const updatedData = {
        type: editTransaction.type,
        amount: editTransaction.amount,
        description: editTransaction.description,
        method: editTransaction.method,
      };

      await updateDoc(doc(db, 'transactions', editId), updatedData);

      setSuccessMessage('Transazione modificata con successo!');
      // Chiudiamo la modalità edit e ricarichiamo la lista
      setEditId(null);
      setEditTransaction(null);

      loadTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Errore nella modifica della transazione');
    } finally {
      setIsEditing(false);
    }
  };

  /**
   * Calcolo saldo di oggi
   */
  const todayBalance = transactions.reduce((acc, curr) => {
    return acc + (curr.type === 'income' ? curr.amount : -curr.amount);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Messaggio di errore */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2 text-red-400 mb-4 transition duration-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Messaggio di successo */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-2 text-green-500 mb-4 transition duration-300">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {/* Form per aggiungere nuova transazione */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Registra Movimento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <button
              type="button"
              className={`flex-1 p-4 rounded-lg border transition-colors duration-300 
                ${
                  newTransaction.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                }
              `}
              onClick={() =>
                setNewTransaction((prev) => ({ ...prev, type: 'income' }))
              }
            >
              <Plus className="mx-auto h-6 w-6 text-green-500" />
              <span className="text-xl font-semibold text-white mb-4">Entrata</span>
            </button>
            <button
              type="button"
              className={`flex-1 p-4 rounded-lg border transition-colors duration-300
                ${
                  newTransaction.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                }
              `}
              onClick={() =>
                setNewTransaction((prev) => ({ ...prev, type: 'expense' }))
              }
            >
              <Minus className="mx-auto h-6 w-6 text-red-500" />
              <span className="text-xl font-semibold text-white mb-4">Uscita</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xl font-semibold text-white mb-4">Importo</label>
              <input
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-xl font-semibold text-white mb-4">Metodo</label>
              <select
                value={newTransaction.method}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    method: e.target.value as 'cash' | 'card' | 'transfer',
                  }))
                }
                className="w-full p-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800  text-white"
              >
                <option value="cash">Contanti</option>
                <option value="card">Carta</option>
                <option value="transfer">Bonifico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xl font-semibold text-white mb-4 text-white">Descrizione</label>
            <input
              type="text"
              value={newTransaction.description}
              onChange={(e) =>
                setNewTransaction((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 
              flex items-center justify-center gap-2 transition-colors duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSubmitting ? 'Salvataggio...' : 'Salva'}
          </button>
        </form>
      </div>

      {/* Lista movimenti di oggi */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 ">Movimenti di Oggi</h2>
          <div className="text-lg font-semibold text-white mb-4">
            Saldo: €{todayBalance.toFixed(2)}
          </div>
        </div>

        {/* Spinner per la prima pagina */}
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Elenco transazioni */}
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isEditingThis = transaction.id === editId; // vero se stiamo modificando questa riga

                return (
                  <div
                    key={transaction.id}
                    className={`p-4 rounded-lg border transition-colors duration-300 
                      ${
                        transaction.type === 'income'
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                      }
                    `}
                  >
                    {/* Se stiamo modificando questa transazione, mostriamo un mini-form inline */}
                    {isEditingThis && editTransaction ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Type */}
                          <div className="flex gap-4">
                            <button
                              type="button"
                              className={`flex-1 p-2 rounded-lg border transition-colors duration-300
                                ${
                                  editTransaction.type === 'income'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                                }
                              `}
                              onClick={() =>
                                setEditTransaction((prev) => ({
                                  ...prev,
                                  type: 'income',
                                }))
                              }
                            >
                              <Plus className="mx-auto h-5 w-5 text-green-500" />
                              <span className="block text-xs">Entrata</span>
                            </button>
                            <button
                              type="button"
                              className={`flex-1 p-2 rounded-lg border transition-colors duration-300
                                ${
                                  editTransaction.type === 'expense'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                                }
                              `}
                              onClick={() =>
                                setEditTransaction((prev) => ({
                                  ...prev,
                                  type: 'expense',
                                }))
                              }
                            >
                              <Minus className="mx-auto h-5 w-5 text-red-500" />
                              <span className="text-xl font-semibold text-white mb-4">Uscita</span>
                            </button>
                          </div>

                          {/* Metodo */}
                          <div>
                            <label className="block text-xs font-medium mb-1 text-white">
                              Metodo
                            </label>
                            <select
                              value={editTransaction.method}
                              onChange={(e) =>
                                setEditTransaction((prev) => ({
                                  ...prev,
                                  method: e.target
                                    .value as 'cash' | 'card' | 'transfer',
                                }))
                              }
                              className="w-full p-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-white"
                            >
                              <option value="cash">Contanti</option>
                              <option value="card">Carta</option>
                              <option value="transfer">Bonifico</option>
                            </select>
                          </div>
                        </div>

                        {/* Amount */}
                        <div>
                          <label className="block text-xs font-medium mb-1 text-white">
                            Importo
                          </label>
                          <input
                            type="number"
                            value={editTransaction.amount || ''}
                            onChange={(e) =>
                              setEditTransaction((prev) => ({
                                ...prev,
                                amount: parseFloat(e.target.value),
                              }))
                            }
                            className="w-full p-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text white text-sm"
                            step="0.01"
                          />
                        </div>

                        {/* Descrizione */}
                        <div>
                          <label className="block text-xs font-medium mb-1 text-white">
                            Descrizione
                          </label>
                          <input
                            type="text"
                            value={editTransaction.description || ''}
                            onChange={(e) =>
                              setEditTransaction((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="w-full p-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-white text-sm"
                          />
                        </div>

                        {/* Pulsanti salva e annulla */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isEditing}
                            className={`bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors duration-300 disabled:opacity-50`}
                          >
                            {isEditing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {isEditing ? 'Salvataggio...' : 'Salva Modifiche'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Altrimenti, mostriamo i dati normali della transazione */
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-500 dark:text-white">
                            {transaction.date.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-white">
  {transaction.type === 'income' ? '+' : '-'}€
  {transaction.amount.toFixed(2)}
</span>

                          {/* Pulsanti azioni */}
                          <button
                            onClick={() => handleStartEdit(transaction)}
                            className="text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottone “Carica altri” se ci sono ancora record */}
            {!noMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMoreTransactions}
                  disabled={isLoadingMore}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors duration-300 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Carica altri'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cassa;
