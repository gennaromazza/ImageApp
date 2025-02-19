import React from 'react';
import { Share2, Image, Type, FileText, Globe } from 'lucide-react';
import type { EventSettings } from '../../types/settings';

interface SocialSharingSettingsProps {
  settings: EventSettings;
  onChange: (changes: Partial<EventSettings>) => void;
}

const SocialSharingSettings: React.FC<SocialSharingSettingsProps> = ({
  settings,
  onChange
}) => {
  const handleSocialChange = (field: string, value: string) => {
    onChange({
      social: {
        ...settings.social,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Share2 className="text-[--theater-gold]" />
        Impostazioni Condivisione Social
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2 flex items-center gap-2">
            <Image size={16} />
            Immagine Anteprima
          </label>
          <input
            type="url"
            value={settings.social?.image || ''}
            onChange={(e) => handleSocialChange('image', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-sm text-gray-400 mt-1">
            Dimensioni consigliate: 1200x630 pixel
          </p>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 flex items-center gap-2">
            <Type size={16} />
            Titolo Anteprima
          </label>
          <input
            type="text"
            value={settings.social?.title || ''}
            onChange={(e) => handleSocialChange('title', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Carnevale Cinematografico 2025"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Descrizione Anteprima
          </label>
          <textarea
            value={settings.social?.description || ''}
            onChange={(e) => handleSocialChange('description', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            rows={3}
            placeholder="Prenota il tuo servizio fotografico per il Carnevale Cinematografico 2025"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 flex items-center gap-2">
            <Globe size={16} />
            URL Sito
          </label>
          <input
            type="url"
            value={settings.social?.url || ''}
            onChange={(e) => handleSocialChange('url', e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="https://gennaromazzacane.it/carnival2025"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-400 text-sm">
              <p className="font-medium mb-1">Anteprima Social</p>
              <p>
                Queste impostazioni controllano come appare il link quando viene condiviso su WhatsApp,
                Facebook e altri social media. L'immagine dovrebbe essere rappresentativa del tuo evento
                e catturare l'attenzione.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSharingSettings;