import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Calendar,
  Package2,
  Users,
  Plus,
  Image,
  Search,
  Check
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';
import { useSettings } from '../../hooks/useSettings';
import { useBookingStatus } from '../../contexts/BookingStatusContext';
import { updateEventSettings } from '../../lib/settings';
import { useAuth } from '../../contexts/AuthContext';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import SettingsPanel from '../settings/SettingsPanel';
import ProductsManager from '../ProductsManager';
import SubscriptionsPage from '../../pages/admin/SubscriptionsPage';
import ManualBookingForm from './ManualBookingForm';
import GalleryManager from '../gallery/GalleryManager';
import type { Booking } from '../../types/booking';
import { toast } from 'react-hot-toast';

type TabType = 'bookings' | 'products' | 'subscriptions' | 'gallery';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [showSettings, setShowSettings] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [galleryItemsToShow, setGalleryItemsToShow] = useState(12);

  const { settings } = useSettings();
  const { statuses, getStatusColor } = useBookingStatus();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'bookings'),
        orderBy('booking_date', 'asc'),
        orderBy('booking_time', 'asc')
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const bookingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Booking[];
          setBookings(bookingsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching bookings:', err);
          setError('Errore nel caricamento delle prenotazioni');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up bookings listener:', err);
      setError('Errore nella configurazione del listener delle prenotazioni');
      setLoading(false);
    }
  }, [user]);

  const handleBookingClick = async (booking: Booking) => {
    if (booking.hasNewSelection) {
      try {
        await updateDoc(doc(db, 'bookings', booking.id), {
          hasNewSelection: false
        });
      } catch (error) {
        console.error('Error updating booking selection status:', error);
      }
    }
    setSelectedBooking(booking);
  };

  const getServiceLabel = (service: string) => {
    if (!settings?.serviceTypes) return service;
    const serviceType = settings.serviceTypes.find(s => s.id === service);
    return serviceType?.name || service;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (booking.firstName + ' ' + booking.lastName).toLowerCase().includes(searchLower) ||
        booking.email?.toLowerCase().includes(searchLower) ||
        booking.phone?.includes(searchTerm) ||
        booking.ticket_number?.toLowerCase().includes(searchLower) ||
        booking.notes?.toLowerCase().includes(searchLower);  // Aggiunto qui
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesService = serviceFilter === 'all' || booking.service_type === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [bookings, searchTerm, statusFilter, serviceFilter]);
  
  const renderGalleryContent = () => {
    if (selectedBooking) {
      return (
        <GalleryManager
          bookingId={selectedBooking.id}
          isOpen={true}
          onClose={() => setSelectedBooking(null)}
        />
      );
    }
    const displayedGalleryBookings = filteredBookings.slice(0, galleryItemsToShow);
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <Image className="text-[--theater-gold]" />
                Gestione Galleria
              </h2>
              <p className="text-gray-400">
                Seleziona una prenotazione per gestire la sua galleria fotografica
              </p>
            </div>
          </div>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per nome, email, telefono o ticket..."
              className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {displayedGalleryBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-700 p-4 rounded-lg hover:bg-gray-600/50 transition-colors cursor-pointer ${
                booking.hasNewSelection ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => handleBookingClick(booking)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[--theater-gold]" />
                    <span className="text-white font-medium">
                      {booking.firstName} {booking.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{booking.booking_date} {booking.booking_time}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    #{booking.ticket_number}
                  </div>
                  {booking.hasNewSelection && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      <Check size={12} />
                      Nuova selezione
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {displayedGalleryBookings.length < filteredBookings.length && (
          <div className="flex justify-center mt-6 bg-gray-700 p-4 rounded-lg">
            <button
              onClick={() => setGalleryItemsToShow(prev => prev + 12)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Carica Altri
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header unificato */}
      <div className="bg-gray-800 p-4 sticky top-0 z-30 shadow-lg flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-[--theater-gold] text-black'
                : 'bg-gray-700 text-white'
            }`}
          >
            <Calendar size={20} />
            Prenotazioni
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-[--theater-gold] text-black'
                : 'bg-gray-700 text-white'
            }`}
          >
            <Package2 size={20} />
            Prodotti
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-[--theater-gold] text-black'
                : 'bg-gray-700 text-white'
            }`}
          >
            <Image size={20} />
            Gallerie
          </button>
          
        </div>
        {activeTab === 'bookings' && (
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setShowManualBooking(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <Plus size={20} />
              Nuova Prenotazione
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500"
            >
              <Film size={20} />
              Impostazioni
            </button>
          </div>
        )}
      </div>

      {activeTab === 'products' && <ProductsManager />}
      {activeTab === 'subscriptions' && <SubscriptionsPage />}
      {activeTab === 'bookings' && (
        <div>
          <h2 className="text-3xl text-white text-center mb-8 font-marquee">
            Gestione Prenotazioni
          </h2>
          {showSettings && settings && (
            <SettingsPanel
              settings={settings}
              onSave={updateEventSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
          <BookingFilters
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            serviceFilter={serviceFilter}
            serviceTypes={settings?.serviceTypes || []}
            onSearchChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onServiceFilterChange={setServiceFilter}
          />
          <BookingTable
            bookings={filteredBookings}
            serviceTypes={settings?.serviceTypes || []}
            bookingStatuses={statuses}
            getServiceLabel={getServiceLabel}
            getStatusColor={getStatusColor}
          />
          <ManualBookingForm
            isOpen={showManualBooking}
            onClose={() => setShowManualBooking(false)}
            onSuccess={() => {
              setShowManualBooking(false);
              toast.success('Prenotazione creata con successo');
            }}
          />
        </div>
      )}
      {activeTab === 'gallery' && renderGalleryContent()}
    </div>
  );
};

export default AdminPanel;
