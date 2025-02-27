import React from 'react';
import { Edit2 } from 'lucide-react';
import { useBookingStatus } from '../contexts/BookingStatusContext';
import { motion } from 'framer-motion';

interface BookingStatusProps {
  statusId: string;
  onEdit?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const BookingStatus: React.FC<BookingStatusProps> = ({ 
  statusId, 
  onEdit,
  size = 'md'
}) => {
  const { getStatusColor, getStatusName } = useBookingStatus();

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const color = getStatusColor(statusId);

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-full flex items-center gap-2 ${sizeClasses[size]}`}
        style={{ 
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`
        }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
        <span style={{ color: color }}>
          {getStatusName(statusId)}
        </span>
      </motion.div>

      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Modifica stato"
        >
          <Edit2 size={14} className="text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default BookingStatus;