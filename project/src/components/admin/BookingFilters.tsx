import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import type { ServiceType } from '../../types/settings';
import { useBookingStatus } from '../../contexts/BookingStatusContext';

interface BookingFiltersProps {
  searchTerm: string;
  statusFilter: string;
  serviceFilter: string;
  serviceTypes: ServiceType[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onServiceFilterChange: (value: string) => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
  searchTerm,
  statusFilter,
  serviceFilter,
  serviceTypes = [], // Provide default empty array
  onSearchChange,
  onStatusFilterChange,
  onServiceFilterChange
}) => {
  const { statuses = [] } = useBookingStatus(); // Provide default empty array

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome, email, telefono o ticket..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="text-gray-400 flex-shrink-0" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="all">Tutti gli stati</option>
          {statuses
            .filter(status => status.enabled)
            .map(status => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="text-gray-400 flex-shrink-0" />
        <select
          value={serviceFilter}
          onChange={(e) => onServiceFilterChange(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="all">Tutti i servizi</option>
          {serviceTypes
            .filter(service => service.enabled)
            .map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default BookingFilters;