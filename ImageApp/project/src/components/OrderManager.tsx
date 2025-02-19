import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, DollarSign, FileText, Check, Clock, Receipt, Wallet, BanknoteIcon, CreditCard, X, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useSettings } from '../hooks/useSettings';
import {
  createOrder,
  updateOrder,
  recordPayment,
  deletePayment,
  generateWhatsAppReceipt,
  getPaymentHistory,
  type Order,
  type OrderItem,
  type PaymentRecord,
  type PaymentMethod
} from '../lib/products';
import OrderNotes from './OrderNotes';

interface OrderManagerProps {
  bookingId: string;
  booking: any;
}

const OrderManager: React.FC<OrderManagerProps> = ({ bookingId, booking }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: { quantity: number, price: number, customName?: string, customDescription?: string }}>({});
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { settings } = useSettings();

  // Stato per il modal del prodotto personalizzato
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  // Stato per memorizzare i dati del prodotto personalizzato
  const [customProduct, setCustomProduct] = useState({
    name: '',
    price: 0,
    quantity: 1,
    description: ''
  });
  // Stato per errori di validazione nel form personalizzato
  const [customProductError, setCustomProductError] = useState<string | null>(null);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('bookingId', '==', bookingId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const orderData = snapshot.docs[0].data() as Order;
        setOrder({ ...orderData, id: snapshot.docs[0].id });
      }
    });
    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    if (order && showPaymentHistory) {
      loadPaymentHistory();
    }
  }, [order, showPaymentHistory]);

  useEffect(() => {
    if (showAddProducts) {
      setSelectedProducts({});
    }
  }, [showAddProducts]);

  // Validazione in tempo reale del form personalizzato
  useEffect(() => {
    if (customProduct.name.trim() === '') {
      setCustomProductError('Il nome è obbligatorio');
    } else if (customProduct.price <= 0) {
      setCustomProductError('Il prezzo deve essere maggiore di 0');
    } else if (customProduct.quantity < 1) {
      setCustomProductError('La quantità deve essere almeno 1');
    } else {
      setCustomProductError(null);
    }
  }, [customProduct]);

  const loadPaymentHistory = async () => {
    if (!order) return;
    try {
      const history = await getPaymentHistory(order.id);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setError('Errore nel caricamento dello storico pagamenti');
    }
  };

  const handleAddProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Crea gli item escludendo i campi undefined
      const items: OrderItem[] = Object.entries(selectedProducts).map(([prodId, data]) => {
        const item: OrderItem = {
          productId: prodId,
          quantity: data.quantity,
          price: data.price
        };
        if (data.customName != null) item.customName = data.customName;
        if (data.customDescription != null) item.customDescription = data.customDescription;
        return item;
      });

      if (order) {
        const updatedItems = [...order.items, ...items];
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await updateOrder(order.id, {
          items: updatedItems,
          totalAmount,
          balance: totalAmount - (order.paidAmount || 0)
        });
      } else {
        await createOrder(bookingId, items);
      }
      setShowAddProducts(false);
      setSelectedProducts({});
    } catch (error) {
      console.error('Error adding products:', error);
      setError('Errore durante l\'aggiunta dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!order) return;
    setLoading(true);
    setError(null);
    try {
      const updatedItems = order.items.filter(item => item.productId !== productId);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      await updateOrder(order.id, {
        items: updatedItems,
        totalAmount,
        balance: totalAmount - (order.paidAmount || 0)
      });
    } catch (error) {
      console.error('Error removing product:', error);
      setError('Errore durante la rimozione del prodotto');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppReceipt = async () => {
    if (!order || !settings) return;
    try {
      setLoading(true);
      setError(null);
      const whatsappMessage = await generateWhatsAppReceipt(order, booking, settings.products, settings);
      window.open(whatsappMessage, '_blank');
    } catch (error) {
      console.error('Error generating receipt:', error);
      setError('Errore nella generazione della ricevuta WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderSummary = () => {
    if (!order || !settings) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full ${
              order.status === 'paid'
                ? 'bg-green-500/20 text-green-400'
                : order.status === 'partial'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {order.status === 'paid' ? 'Pagato' : order.status === 'partial' ? 'Acconto' : 'In attesa'}
            </span>
            <span className="text-[--theater-gold] font-medium">€{order.totalAmount.toFixed(2)}</span>
          </div>
          {order.paidAmount > 0 && (
            <span className="text-green-400 text-xs">Pagato: €{order.paidAmount.toFixed(2)}</span>
          )}
        </div>
        {/* Lista prodotti */}
        <div className="space-y-2 mt-4">
          {order.items.map((item, index) => {
            const product = settings.products.find(p => p.id === item.productId);
            const productName = product ? product.name : item.customName;
            if (!productName) return null;
            const key = (item.productId && item.productId.trim() !== '')
              ? `${item.productId}-${index}`
              : `custom-${index}`;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between bg-gray-700 p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  {product && product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : null}
                  <div>
                    <div className="font-medium text-white">{productName}</div>
                    <div className="text-sm text-gray-400">{item.quantity}x €{item.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[--theater-gold]">€{(item.quantity * item.price).toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveProduct(item.productId)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Rimuovi prodotto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Indicatore note */}
        {order.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-2">
            <div className="flex items-start gap-2">
              <FileText size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
              <p className="text-sm text-yellow-400 line-clamp-2">{order.notes}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {order ? (
        <>
          {renderOrderSummary()}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddProducts(true)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              <Plus size={14} />
              Prodotti
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 text-sm"
            >
              <DollarSign size={14} />
              Pagamento
            </button>
            <button
              onClick={() => setShowPaymentHistory(true)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 text-sm"
            >
              <Clock size={14} />
              Storico
            </button>
            <button
              onClick={handleWhatsAppReceipt}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#25D366]/20 text-[#25D366] rounded hover:bg-[#25D366]/30 text-sm disabled:opacity-50"
            >
              {loading ? <span className="animate-spin">⌛</span> : <Receipt size={14} />}
              Ricevuta
            </button>
            <button
              onClick={() => setShowNotesModal(true)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                order.notes
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <FileText size={14} />
              {order.notes ? 'Modifica Note' : 'Note'}
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddProducts(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 text-sm font-medium"
          >
            <Plus size={16} />
            Nuovo Ordine
          </button>
        </div>
      )}

      <AnimatePresence>
        {/* Modal Aggiunta Prodotti */}
        {showAddProducts && (
          <motion.div
            key="add-products-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl"
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                {order ? 'Aggiungi Prodotti all\'Ordine' : 'Nuovo Ordine'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                {settings?.products
                  .filter(product => product.enabled)
                  .map(product => (
                    <div key={product.id} className="bg-gray-700 p-4 rounded-lg">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h4 className="text-white font-medium">{product.name}</h4>
                      <p className="text-gray-400 text-sm mb-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[--theater-gold]">€{product.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={selectedProducts[product.id]?.quantity || 0}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value);
                              if (quantity === 0) {
                                const { [product.id]: _, ...rest } = selectedProducts;
                                setSelectedProducts(rest);
                              } else {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  [product.id]: { quantity, price: product.price }
                                });
                              }
                            }}
                            className="w-20 p-1 bg-gray-600 border border-gray-500 rounded text-white text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowCustomProductForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Aggiungi Prodotto Personalizzato
                </button>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddProducts(false);
                    setSelectedProducts({});
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddProducts}
                  disabled={Object.keys(selectedProducts).length === 0 || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      {order ? 'Aggiunta in corso...' : 'Creazione in corso...'}
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      {order ? 'Aggiungi Prodotti' : 'Crea Ordine'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Prodotto Personalizzato */}
        {showCustomProductForm && (
          <motion.div
            key="custom-product-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl"
            >
              <button
                onClick={() => setShowCustomProductForm(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-semibold text-white mb-4">Prodotto Personalizzato</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Nome del prodotto"
                    value={customProduct.name}
                    onChange={e => setCustomProduct({ ...customProduct, name: e.target.value })}
                    className={`w-full p-2 bg-gray-700 border rounded text-white focus:outline-none ${
                      customProductError && customProduct.name.trim() === '' ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {customProductError && customProduct.name.trim() === '' && (
                    <p className="text-red-500 text-xs mt-1">{customProductError}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Prezzo"
                    value={customProduct.price}
                    onChange={e => setCustomProduct({ ...customProduct, price: parseFloat(e.target.value) })}
                    className={`w-full p-2 bg-gray-700 border rounded text-white focus:outline-none ${
                      customProductError && customProduct.price <= 0 ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {customProductError && customProduct.price <= 0 && (
                    <p className="text-red-500 text-xs mt-1">{customProductError}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Quantità"
                    value={customProduct.quantity}
                    onChange={e => setCustomProduct({ ...customProduct, quantity: parseInt(e.target.value) })}
                    className={`w-full p-2 bg-gray-700 border rounded text-white focus:outline-none ${
                      customProductError && customProduct.quantity < 1 ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {customProductError && customProduct.quantity < 1 && (
                    <p className="text-red-500 text-xs mt-1">{customProductError}</p>
                  )}
                </div>
                <div>
                  <textarea
                    placeholder="Descrizione (opzionale)"
                    value={customProduct.description}
                    onChange={e => setCustomProduct({ ...customProduct, description: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowCustomProductForm(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    if (customProductError) return;
                    const customId = 'custom_' + Date.now();
                    setSelectedProducts({
                      ...selectedProducts,
                      [customId]: {
                        quantity: customProduct.quantity,
                        price: customProduct.price,
                        customName: customProduct.name,
                        customDescription: customProduct.description
                      }
                    });
                    setShowCustomProductForm(false);
                    setCustomProduct({ name: '', price: 0, quantity: 1, description: '' });
                  }}
                  disabled={!!customProductError}
                  className={`px-4 py-2 rounded ${
                    customProductError
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Check size={20} />
                  Aggiungi Prodotto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Pagamento */}
        {showPaymentModal && order && (
          <motion.div
            key="payment-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Registra Pagamento</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-gray-400">Totale da Pagare:</span>
                    <span className="block text-xl text-[--theater-gold]">€{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Saldo Rimanente:</span>
                    <span className="block text-xl text-red-400">€{order.balance.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Importo Pagamento</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={order.balance}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                      className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Metodo di Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center justify-center gap-2 p-2 rounded ${
                        paymentMethod === 'cash' ? 'bg-[--theater-gold] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <BanknoteIcon size={16} />
                      Contanti
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center gap-2 p-2 rounded ${
                        paymentMethod === 'card' ? 'bg-[--theater-gold] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <CreditCard size={16} />
                      Carta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex items-center justify-center gap-2 p-2 rounded ${
                        paymentMethod === 'transfer' ? 'bg-[--theater-gold] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <Wallet size={16} />
                      Bonifico
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Note (opzionale)</label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    rows={3}
                    placeholder="Aggiungi una nota per questo pagamento..."
                  />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentAmount(0);
                      setPaymentMethod('cash');
                      setPaymentNote('');
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await recordPayment(order.id, paymentAmount, paymentMethod, paymentNote);
                        setShowPaymentModal(false);
                        setPaymentAmount(0);
                        setPaymentMethod('cash');
                        setPaymentNote('');
                      } catch (error) {
                        console.error('Error recording payment:', error);
                        setError('Errore durante la registrazione del pagamento');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={paymentAmount <= 0 || paymentAmount > order.balance || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⌛</span>
                        Registrazione in corso...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Conferma Pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Storico Pagamenti */}
        {showPaymentHistory && order && (
          <motion.div
            key="payment-history-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative"
            >
              <button
                onClick={() => setShowPaymentHistory(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="text-[--theater-gold]" />
                Storico Pagamenti
              </h3>
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {paymentHistory.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[--theater-gold] font-medium">€{payment.amount.toFixed(2)}</span>
                        <div className="text-sm text-gray-400 mt-1">{payment.date.toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {payment.method === 'cash' && <BanknoteIcon size={16} className="text-green-400" />}
                          {payment.method === 'card' && <CreditCard size={16} className="text-blue-400" />}
                          {payment.method === 'transfer' && <Wallet size={16} className="text-purple-400" />}
                          <span className="text-gray-300">
                            {payment.method === 'cash' ? 'Contanti' : payment.method === 'card' ? 'Carta' : 'Bonifico'}
                          </span>
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <FileText size={14} className="mt-1" />
                          <p>{payment.notes}</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questo pagamento?')) {
                            deletePayment(order.id, payment.id);
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                        title="Elimina pagamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {paymentHistory.length === 0 && (
                  <div className="text-center text-gray-400 py-8">Nessun pagamento registrato</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showNotesModal && order && (
          <OrderNotes order={order} isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} />
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mt-4"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default OrderManager;
