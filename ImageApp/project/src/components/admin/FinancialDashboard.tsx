import React, { useState, useEffect } from 'react';
import { AlertCircle, Euro, TrendingUp, BanknoteIcon, FileText } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Order, PaymentRecord } from '../../lib/products';
import Cassa from './Cassa';
import RendicontoUnificato from './RendicontoUnificato';
import ReportCharts from './ReportCharts'; // <-- import del tuo componente grafico dedicato

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  method: 'cash' | 'card' | 'transfer';
}

interface FinancialDashboardProps {
  bookingId?: string;
}

/**
 * Dati per il grafico Entrate/Uscite
 * (vedi definizione in ReportCharts se vuoi digitare esattamente)
 */
interface ChartDataPoint {
  date: string; 
  revenue: number; 
  expenses: number;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ bookingId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selettore per Giornaliero/Settimanale/Mensile
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Metriche (come in precedenza)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    totalAdvancePayments: 0,
    paymentMethods: {
      cash: 0,
      card: 0,
      transfer: 0
    }
  });

  // Stato per i pagamenti caricati da payment_history
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);

  // Dati per il grafico Entrate/Uscite
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Carichiamo in parallelo ordini, transazioni e pagamenti
    Promise.all([loadOrders(), loadTransactions(), loadPayments()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [bookingId]);

  // Ogni volta che cambiano "transactions" o "allPayments", rigeneriamo i dati per il grafico
  useEffect(() => {
    unifyChartData();
  }, [transactions, allPayments]);

  // ===== Caricamento transazioni (cassa) =====
  const loadTransactions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'transactions'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as Transaction[];
      setTransactions(data);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Errore nel caricamento delle transazioni');
    }
  };

  // ===== Caricamento pagamenti (payment_history) =====
  const loadPayments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'payment_history'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as PaymentRecord[];
      setAllPayments(data);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Errore nel caricamento dei pagamenti');
    }
  };

  // ===== Caricamento ordini (orders) e calcolo metriche =====
  const loadOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = bookingId
        ? query(ordersRef, where('bookingId', '==', bookingId))
        : query(ordersRef);

      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      // Se vuoi collegare i pagamenti agli ordini (per metriche):
      const paymentsSnapshot = await getDocs(collection(db, 'payment_history'));
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as PaymentRecord[];

      const ordersWithPayments = ordersData.map(order => {
        const orderPayments = payments.filter(p => p.orderId === order.id);
        return { ...order, payments: orderPayments };
      });

      calculateMetrics(ordersWithPayments, payments);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Errore nel caricamento dei dati');
    }
  };

  // ===== Calcolo metriche =====
  const calculateMetrics = (
    ordersData: (Order & { payments: PaymentRecord[] })[],
    payments: PaymentRecord[]
  ) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingAmount = ordersData.reduce((sum, order) => sum + (order.balance || 0), 0);
    const avgOrderValue = totalRevenue / (ordersData.length || 1);
    const totalAdvancePayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Metodi di pagamento: partiamo dai pagamenti degli ordini
    const paymentMethods = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, { cash: 0, card: 0, transfer: 0 });

    // Aggiungiamo le transazioni "income" della cassa
    transactions.forEach(t => {
      if (t.type === 'income') {
        paymentMethods[t.method] += t.amount;
      }
    });

    setMetrics({
      totalRevenue,
      pendingAmount,
      avgOrderValue,
      totalOrders: ordersData.length,
      totalAdvancePayments,
      paymentMethods
    });
  };

  // ===== Creazione dati unificati per il grafico (entrate/uscite) =====
  const unifyChartData = () => {
    // 1) Mappiamo i pagamenti come "income"
    const mappedPayments = allPayments.map(p => ({
      date: p.date,
      type: 'income' as const,
      amount: p.amount
    }));

    // 2) Mappiamo le transazioni cassa come income/expense
    const mappedTransactions = transactions.map(t => ({
      date: t.date,
      type: t.type,
      amount: t.amount
    }));

    // 3) Uniamo i due array
    const unified = [...mappedPayments, ...mappedTransactions];

    // 4) Raggruppa per data
    const aggregator = new Map<string, { date: string; revenue: number; expenses: number }>();

    unified.forEach(item => {
      const dayKey = item.date ? item.date.toLocaleDateString() : 'N/A';
      if (!aggregator.has(dayKey)) {
        aggregator.set(dayKey, { date: dayKey, revenue: 0, expenses: 0 });
      }
      const record = aggregator.get(dayKey)!;
      if (item.type === 'income') {
        record.revenue += item.amount;
      } else {
        record.expenses += item.amount;
      }
    });

    const finalData = Array.from(aggregator.values());
    setChartData(finalData);
  };

  // Se in caricamento, mostriamo loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin text-2xl">⌛</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Eventuali errori */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2 text-red-400">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* --- Metric Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fatturato Totale</h3>
            <Euro className="h-4 w-4 text-[--theater-gold]" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{metrics.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Acconti Ricevuti
            </h3>
            <BanknoteIcon className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{metrics.totalAdvancePayments.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Importo in Sospeso
            </h3>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{metrics.pendingAmount.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Totale Ordini
            </h3>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.totalOrders}
          </div>
        </div>
      </div>

      {/* --- Sezione Cassa --- */}
      <Cassa />

      {/* --- Rendiconto Unificato --- */}
      <RendicontoUnificato />

      {/* --- Nuovo Componente per i grafici --- */}
      <ReportCharts
        // chartData è l'array unificato con { date, revenue, expenses }
        chartData={chartData}
        // Passiamo i metodi di pagamento come array { name, value }
        paymentMethods={[
          { name: 'Contanti', value: metrics.paymentMethods.cash },
          { name: 'Carta', value: metrics.paymentMethods.card },
          { name: 'Bonifico', value: metrics.paymentMethods.transfer }
        ]}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />
    </div>
  );
};

export default FinancialDashboard;
