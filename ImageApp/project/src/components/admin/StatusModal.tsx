import React, { useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import type { BookingStatus } from '../../types/settings';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Conteggio prenotazioni per ogni stato, es. { "pending": 3, "completed": 2 } */
  statusCounts: Record<string, number>;
  /** Elenco di stati definiti nella tua app */
  bookingStatuses: BookingStatus[];
  /**
   * Funzione che dato lo "status.id" restituisce un colore, es. "#4CAF50"
   */
  getStatusColor: (statusId: string) => string;
  /** Conteggio totale di tutte le prenotazioni */
  totalBookings: number;
  /** Conteggio delle prenotazioni "attive" */
  activeBookings: number;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  statusCounts,
  bookingStatuses,
  getStatusColor,
  totalBookings,
  activeBookings,
}) => {
  // 1) Selettore per l’ordinamento (nome o conteggio)
  const [sortMode, setSortMode] = useState<'name' | 'count'>('name');

  // Stato locale per simulare un “ultimo aggiornamento” e pulsante di Refresh
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(
    new Date().toLocaleString()
  );

  // Calcoliamo un array di stati con il relativo conteggio
  const statusesWithCount = useMemo(() => {
    return bookingStatuses.map((status) => ({
      ...status,
      count: statusCounts[status.id] || 0,
    }));
  }, [bookingStatuses, statusCounts]);

  // 2) & 3) & 5) Prepariamo i dati per percentuali, barre e CSV
  const sortedStatuses = useMemo(() => {
    // Ordinamento condizionale
    const list = [...statusesWithCount];
    if (sortMode === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return list.sort((a, b) => b.count - a.count);
    }
  }, [statusesWithCount, sortMode]);

  // Percentuali e generazione CSV
  const csvData = useMemo(() => {
    // Evitiamo divisioni per zero
    const total = totalBookings === 0 ? 1 : totalBookings;
    // Creiamo l'header e le righe
    const rows = sortedStatuses.map((s) => {
      const percentage = ((s.count / total) * 100).toFixed(1) + '%';
      return `${s.name};${s.count};${percentage}`;
    });
    return ['Stato;Conteggio;Percentuale', ...rows].join('\n');
  }, [sortedStatuses, totalBookings]);

  // 4) Pulsante per forzare un “refresh” (es: ricaricare dati da server)
  const handleRefresh = () => {
    // Per semplicità aggiorniamo solo l’ora di ultimo aggiornamento
    setLastUpdatedAt(new Date().toLocaleString());
    // In un caso reale potresti scatenare una nuova fetch dei dati
  };

  // 5) Esportazione CSV
  const handleExportCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'status_stats.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="w-96">
      <h2 className="text-xl text-white mb-4">Dettagli Stati</h2>

      <div className="mb-4 text-white space-y-1">
        <p>
          Totale prenotazioni:{' '}
          <span className="font-semibold">{totalBookings}</span>
        </p>
        <p>
          Prenotazioni attive:{' '}
          <span className="font-semibold">{activeBookings}</span>
        </p>
        <p className="text-sm text-gray-400">
          Ultimo aggiornamento: {lastUpdatedAt}
        </p>
      </div>

      {/* Pulsanti per funzioni aggiuntive */}
      <div className="flex items-center gap-2 justify-between mb-4">
        {/* Selettore di ordinamento */}
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Ordina per:</span>
          <select
            className="text-sm px-2 py-1 bg-gray-600 text-white rounded"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'name' | 'count')}
          >
            <option value="name">Nome</option>
            <option value="count">Conteggio</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-500 transition-colors"
        >
          Refresh
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-500 transition-colors"
        >
          Esporta CSV
        </button>
      </div>

      {/* Elenco stati con conteggio e progress bar */}
      <ul>
        {sortedStatuses.map((status) => {
          // Calcolo percentuale su totalBookings
          const percentage =
            totalBookings > 0
              ? (status.count / totalBookings) * 100
              : 0;

          return (
            <li key={status.id} className="mb-3">
              <div className="flex justify-between text-sm text-white mb-1">
                <span
                  style={{ color: getStatusColor(status.id) }}
                  className="font-semibold"
                >
                  {status.name}
                </span>
                <span>
                  {status.count} (
                  {percentage.toFixed(1)}
                  %)
                </span>
              </div>
              {/* Barra di progresso */}
              <div className="h-2 bg-gray-600 rounded">
                <div
                  className="h-2 rounded"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getStatusColor(status.id),
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <button
        onClick={onClose}
        className="mt-6 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors w-full"
      >
        Chiudi
      </button>
    </BaseModal>
  );
};

export default StatusModal;
