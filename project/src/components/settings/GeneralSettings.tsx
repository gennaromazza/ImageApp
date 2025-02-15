import React from 'react';
import { Clock, Calendar, Users, Timer, Type, Building2, Link, Film, MessageSquare } from 'lucide-react';
import type { EventSettings } from '../../types/settings';
import GoogleCalendarSettings from './GoogleCalendarSettings';

interface GeneralSettingsProps {
  settings: EventSettings;
  onChange: (changes: Partial<EventSettings>) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onChange }) => {
  const handleCompanyChange = (field: string, value: string) => {
    onChange({
      company: {
        ...settings.company,
        [field]: value
      }
    });
  };

  const handleWhatsAppTemplateChange = (field: string, value: string) => {
    onChange({
      whatsappTemplate: {
        ...settings.whatsappTemplate,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Company Info Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6">Informazioni Aziendali</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Building2 size={16} />
              Nome Azienda
            </label>
            <input
              type="text"
              value={settings.company.name}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Link size={16} />
              Logo URL
            </label>
            <input
              type="url"
              value={settings.company.logo}
              onChange={(e) => handleCompanyChange('logo', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Building2 size={16} />
              Indirizzo
            </label>
            <input
              type="text"
              value={settings.company.address}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Link size={16} />
              Sito Web
            </label>
            <input
              type="url"
              value={settings.company.website}
              onChange={(e) => handleCompanyChange('website', e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      {/* Google Calendar Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Calendar className="text-[--theater-gold]" />
          Sincronizzazione Google Calendar
        </h3>
        <div className="bg-gray-700 rounded-lg p-6">
          <GoogleCalendarSettings />
        </div>
      </div>

      {/* WhatsApp Template Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <MessageSquare className="text-[--theater-gold]" />
          Template WhatsApp
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Intestazione Messaggio</label>
            <textarea
              value={settings.whatsappTemplate?.header || '*🎭 CARNEVALE CINEMATOGRAFICO*\n\n*👤 CLIENTE*\nNome: {firstName} {lastName}\nTicket: #{ticketNumber}\n\n*📝 PRODOTTI ORDINATI*'}
              onChange={(e) => handleWhatsAppTemplateChange('header', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-32"
              placeholder="Intestazione del messaggio..."
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Formato Prodotto</label>
            <textarea
              value={settings.whatsappTemplate?.productFormat || '{index}. {productName}\n   Quantità: {quantity}\n   Prezzo: {price}\n   Totale: {total}\n'}
              onChange={(e) => handleWhatsAppTemplateChange('productFormat', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-24"
              placeholder="Formato per ogni prodotto..."
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Formato Pagamento</label>
            <textarea
              value={settings.whatsappTemplate?.paymentFormat || '{index}. {date}\n   Metodo: {method}\n   Importo: {amount}\n'}
              onChange={(e) => handleWhatsAppTemplateChange('paymentFormat', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-24"
              placeholder="Formato per ogni pagamento..."
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Footer Messaggio</label>
            <textarea
              value={settings.whatsappTemplate?.footer || '\n📍 {address}\n📞 Per assistenza: {phone}'}
              onChange={(e) => handleWhatsAppTemplateChange('footer', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white h-24"
              placeholder="Footer del messaggio..."
            />
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Variabili Disponibili</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <p className="font-medium text-[--theater-gold] mb-1">Generali:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{'{firstName}'} - Nome cliente</li>
                  <li>{'{lastName}'} - Cognome cliente</li>
                  <li>{'{ticketNumber}'} - Numero ticket</li>
                  <li>{'{address}'} - Indirizzo</li>
                  <li>{'{phone}'} - Telefono</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-[--theater-gold] mb-1">Prodotti:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{'{index}'} - Numero prodotto</li>
                  <li>{'{productName}'} - Nome prodotto</li>
                  <li>{'{quantity}'} - Quantità</li>
                  <li>{'{price}'} - Prezzo unitario</li>
                  <li>{'{total}'} - Totale prodotto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;