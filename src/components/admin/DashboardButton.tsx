import React from 'react';
import { DollarSign } from 'lucide-react';

interface DashboardButtonProps {
  onClick: () => void;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      <DollarSign size={20} />
      Dashboard Finanziaria
    </button>
  );
};

export default DashboardButton;