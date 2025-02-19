import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar
} from 'recharts';

// Eventuale interfaccia per il "timeframe"
export type Timeframe = 'daily' | 'weekly' | 'monthly';

// Dati per il grafico di Entrate/Uscite
// Each element rappresenta un giorno (o una data specifica) con revenue/expenses
export interface ChartDataPoint {
  date: string;       // "13/02/2025", ad esempio
  revenue: number;    // somma delle entrate in quel giorno
  expenses: number;   // somma delle uscite in quel giorno
}

// Dati per il grafico dei metodi di pagamento
// name: 'Contanti' | 'Carta' | 'Bonifico' | ...
// value: numero corrispondente
export interface PaymentMethodData {
  name: string; 
  value: number;
}

// Props del nostro componente
interface ReportChartsProps {
  chartData: ChartDataPoint[];
  paymentMethods: PaymentMethodData[];
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void; 
}

const ReportCharts: React.FC<ReportChartsProps> = ({
  chartData,
  paymentMethods,
  timeframe,
  setTimeframe
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* --- Andamento Entrate/Uscite --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Andamento Entrate/Uscite
          </h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                       rounded-md px-3 py-1 text-sm"
          >
            <option value="daily">Giornaliero</option>
            <option value="weekly">Settimanale</option>
            <option value="monthly">Mensile</option>
          </select>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4ade80"
                name="Entrate"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#f87171"
                name="Uscite"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Metodi di Pagamento --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Metodi di Pagamento
          </h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentMethods}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportCharts;
