import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Film, Ticket, Settings as SettingsIcon } from 'lucide-react';
import type { EventSettings } from '../../types/settings';
import GeneralSettings from './GeneralSettings';
import ServiceTypes from './ServiceTypes';
import BreakTimes from './BreakTimes';
import StatusManager from './StatusManager';
import TicketTemplateSettings from './TicketTemplateSettings';
import IntroAnimationSettings from './IntroAnimationSettings';
import { useBookingStatus } from '../../contexts/BookingStatusContext';

interface SettingsPanelProps {
  settings: EventSettings;
  onSave: (settings: EventSettings) => Promise<void>;
  onClose: () => void;
}

type TabType = 'general' | 'status' | 'services' | 'breaks' | 'social' | 'ticket' | 'intro';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Generali', icon: SettingsIcon },
  { id: 'status', label: 'Stati Prenotazione', icon: SettingsIcon },
  { id: 'services', label: 'Servizi', icon: SettingsIcon },
  { id: 'breaks', label: 'Pause', icon: SettingsIcon },
  { id: 'ticket', label: 'Template Ticket', icon: Ticket },
  { id: 'intro', label: 'Intro', icon: Film }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [success, setSuccess] = useState(false);
  const { statuses } = useBookingStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      await onSave(currentSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Errore durante il salvataggio delle impostazioni');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            settings={currentSettings}
            onChange={(changes) => setCurrentSettings({ ...currentSettings, ...changes })}
          />
        );
      case 'status':
        return (
          <StatusManager
            statuses={statuses}
            onSave={async (newStatuses) => {
              setCurrentSettings({ ...currentSettings, bookingStatuses: newStatuses });
            }}
          />
        );
      case 'services':
        return (
          <ServiceTypes
            serviceTypes={currentSettings.serviceTypes}
            newServiceType={{
              id: '',
              name: '',
              enabled: true,
              bookingStartDate: '',
              bookingEndDate: ''
            }}
            onServiceTypeChange={(index, field, value) => {
              const updatedTypes = [...currentSettings.serviceTypes];
              updatedTypes[index] = {
                ...updatedTypes[index],
                [field]: value
              };
              setCurrentSettings({
                ...currentSettings,
                serviceTypes: updatedTypes
              });
            }}
            onNewServiceTypeChange={() => {}}
            onAddServiceType={() => {}}
            onRemoveServiceType={(index) => {
              const updatedTypes = currentSettings.serviceTypes.filter((_, i) => i !== index);
              setCurrentSettings({
                ...currentSettings,
                serviceTypes: updatedTypes
              });
            }}
          />
        );
      case 'breaks':
        return (
          <BreakTimes
            breakTimes={currentSettings.breakTimes}
            newBreakTime={{
              start: '',
              end: '',
              enabled: true
            }}
            onBreakTimeChange={(index, field, value) => {
              const updatedBreaks = [...currentSettings.breakTimes];
              updatedBreaks[index] = {
                ...updatedBreaks[index],
                [field]: value
              };
              setCurrentSettings({
                ...currentSettings,
                breakTimes: updatedBreaks
              });
            }}
            onNewBreakTimeChange={() => {}}
            onAddBreakTime={() => {}}
            onRemoveBreakTime={(index) => {
              const updatedBreaks = currentSettings.breakTimes.filter((_, i) => i !== index);
              setCurrentSettings({
                ...currentSettings,
                breakTimes: updatedBreaks
              });
            }}
          />
        );
      case 'social':
     
        
        
      case 'ticket':
        return (
          <TicketTemplateSettings
            type={currentSettings.ticketTemplate?.type || 'classic'}
            enabled={currentSettings.ticketTemplate?.enabled ?? true}
            onChange={(ticketTemplate) => setCurrentSettings(prev => ({
              ...prev,
              ticketTemplate
            }))}
          />
        );
      case 'intro':
        return (
          <IntroAnimationSettings
            enabled={currentSettings.animation?.enabled ?? true}
            title={currentSettings.animation?.title || ''}
            subtitle={currentSettings.animation?.subtitle || ''}
            type={currentSettings.animation?.type || 'curtain'}
            onChange={(animation) => setCurrentSettings(prev => ({
              ...prev,
              animation: {
                ...prev.animation,
                ...animation
              }
            }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Impostazioni</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg">
            Impostazioni salvate con successo
          </div>
        )}

        <div className="flex gap-4 border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[--theater-gold] border-b-2 border-[--theater-gold]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {renderTabContent()}
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 disabled:opacity-50"
          >
            {isUpdating ? 'Salvataggio...' : 'Salva Impostazioni'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPanel;