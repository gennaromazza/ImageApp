import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Order, PaymentRecord } from '../../lib/products';
import Cassa from './Cassa';
import RendicontoUnificato from './RendicontoUnificato';
import ReportCharts from './ReportCharts';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  method: 'cash' | 'card' | 'transfer';
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  expenses: number;
}

interface FinancialDashboardProps {
  bookingId?: string;
}

function useFirestoreCollection<T>(collectionPath: string, q?: any) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collRef = collection(db, collectionPath);
    const qRef = q ? q : query(collRef);
    const unsubscribe = onSnapshot(
      qRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err: Error) => {
        console.error(`Error loading ${collectionPath}:`, err);
        setError(`Errore nel caricamento di ${collectionPath}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [collectionPath, q]);

  return { data, loading, error };
}

function groupByTimeframe(
  unified: { date: Date; type: 'income' | 'expense'; amount: number }[],
  timeframe: 'daily' | 'weekly' | 'monthly'
): ChartDataPoint[] {
  const aggregator = new Map<string, { date: string; revenue: number; expenses: number }>();

  unified.forEach((item) => {
    const dateObj = item.date;
    let key = '';
    if (timeframe === 'daily') {
      key = dateObj.toLocaleDateString();
    } else if (timeframe === 'weekly') {
      const day = dateObj.getDay();
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() - day);
      key = startOfWeek.toLocaleDateString();
    } else if (timeframe === 'monthly') {
      key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
    }
    if (!aggregator.has(key)) {
      aggregator.set(key, { date: key, revenue: 0, expenses: 0 });
    }
    const record = aggregator.get(key)!;
    if (item.type === 'income') {
      record.revenue += item.amount;
    } else {
      record.expenses += item.amount;
    }
  });

  return Array.from(aggregator.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ bookingId }) => {
  const ordersQuery = bookingId
    ? query(collection(db, 'orders'), where('bookingId', '==', bookingId))
    : undefined;
  const { data: orders, loading: loadingOrders, error: ordersError } = useFirestoreCollection<Order>(
    'orders',
    ordersQuery
  );
  const { data: transactions, loading: loadingTransactions, error: transactionsError } =
    useFirestoreCollection<Transaction>('transactions');
  const { data: payments, loading: loadingPayments, error: paymentsError } =
    useFirestoreCollection<PaymentRecord>('payment_history');

  // Stato per il timeframe del grafico
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const unified = [
      ...payments.map((p) => ({
        date: p.date,
        type: 'income' as const,
        amount: p.amount,
      })),
      ...transactions.map((t) => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
      }))
    ];
    const grouped = groupByTimeframe(unified, timeframe);
    setChartData(grouped);
  }, [payments, transactions, timeframe]);

  const loading = loadingOrders || loadingTransactions || loadingPayments;
  const error = ordersError || transactionsError || paymentsError;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin text-2xl">⌛</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {error && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-600 transition duration-300">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {/* Le card con i totali duplicate sono state rimosse: i calcoli unificati li gestisce RendicontoUnificato */}
      
      {/* Sezione Cassa: solo il form per registrare nuovi movimenti */}
      <Cassa />

      {/* Rendiconto Unificato: qui vengono mostrati l'elenco, i filtri, la paginazione e i totali unificati */}
      <RendicontoUnificato />

      {/* Grafico */}
      <ReportCharts
        chartData={chartData}
        paymentMethods={[
          { name: 'Contanti', value: payments.reduce((acc, p) => acc + p.amount, 0) },
          { name: 'Carta', value: payments.filter(p => p.method === 'card').reduce((acc, p) => acc + p.amount, 0) },
          { name: 'Bonifico', value: payments.filter(p => p.method === 'transfer').reduce((acc, p) => acc + p.amount, 0) }
        ]}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />
    </div>
  );
};

export default FinancialDashboard;
