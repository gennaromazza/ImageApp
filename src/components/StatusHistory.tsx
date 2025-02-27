import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { History, User, Clock, FileText } from 'lucide-react';
import type { StatusHistoryEntry } from '../lib/bookingStatus';
import { useBookingStatus } from '../contexts/BookingStatusContext';

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
}

const StatusHistory: React.FC<StatusHistoryProps> = ({ history }) => {
  const { getStatusColor, getStatusName } = useBookingStatus();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <History className="text-[--theater-gold]" />
        Storico Stati
      </h3>

      <div className="space-y-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(entry.fromStatus) }}
                  />
                  <span className="text-gray-300">{getStatusName(entry.fromStatus)}</span>
                </div>
                <span className="text-gray-500">→</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(entry.toStatus) }}
                  />
                  <span className="text-white font-medium">{getStatusName(entry.toStatus)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{entry.changedByEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{format(entry.changedAt, 'dd MMM yyyy HH:mm', { locale: it })}</span>
                </div>
              </div>
            </div>

            {entry.note && (
              <div className="flex items-start gap-2 text-sm text-gray-300 bg-gray-700/50 p-3 rounded">
                <FileText size={16} className="mt-0.5 text-gray-400" />
                <p>{entry.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Nessun cambio di stato registrato
        </div>
      )}
    </div>
  );
};

export default StatusHistory;