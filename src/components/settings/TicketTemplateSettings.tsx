import React from 'react';
import { Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface TicketTemplateSettingsProps {
  type: 'classic' | 'modern' | 'vintage';
  enabled: boolean;
  onChange: (settings: { type: 'classic' | 'modern' | 'vintage'; enabled: boolean }) => void;
}

const TicketTemplateSettings: React.FC<TicketTemplateSettingsProps> = ({
  type,
  enabled,
  onChange
}) => {
  const renderPreview = (templateType: 'classic' | 'modern' | 'vintage') => {
    const commonClasses = "w-full aspect-[9/16] rounded-lg overflow-hidden";

    switch (templateType) {
      case 'classic':
        return (
          <div className={`${commonClasses} bg-gradient-to-br from-red-600 to-red-700 text-white p-6 flex flex-col`}>
            <div className="text-center mb-8">
              <Ticket className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold">Carnevale 2025</h3>
              <p className="text-sm opacity-75">CNC-123456</p>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm opacity-75">Nome</p>
                <p className="font-bold">Mario Rossi</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-sm opacity-75">Data</p>
                <p className="font-bold">01/03/2025</p>
              </div>
            </div>
          </div>
        );

      case 'modern':
        return (
          <div className={`${commonClasses} bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6`}>
            <div className="h-full flex flex-col">
              <div className="text-center flex-1 flex flex-col justify-center">
                <Ticket className="w-16 h-16 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-2">Carnevale</h3>
                <p className="text-lg mb-8">2025</p>
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl">
                  <p className="font-mono text-xl">CNC-123456</p>
                </div>
              </div>
              <div className="mt-auto text-center">
                <p className="text-sm opacity-75">Via Quinto Orazio Flacco 5, Aversa</p>
              </div>
            </div>
          </div>
        );

      case 'vintage':
        return (
          <div className={`${commonClasses} bg-[#f8e5b9] p-6 border-8 border-[#8b4513]`}>
            <div className="h-full flex flex-col items-center justify-center text-[#8b4513]">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-serif mb-2">CARNEVALE</h3>
                <p className="text-xl font-serif">CINEMATOGRAFICO</p>
              </div>
              <div className="w-full h-px bg-[#8b4513] my-6" />
              <div className="font-mono text-xl mb-6">CNC-123456</div>
              <div className="w-full h-px bg-[#8b4513] my-6" />
              <div className="text-center mt-auto">
                <p className="font-serif">01 Marzo 2025</p>
                <p className="font-serif text-sm mt-2">Aversa</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Ticket className="text-[--theater-gold]" />
        Template Ticket
      </h3>

      <div className="grid grid-cols-3 gap-6">
        {(['classic', 'modern', 'vintage'] as const).map((templateType) => (
          <motion.div
            key={templateType}
            whileHover={{ scale: 1.02 }}
            className={`relative cursor-pointer rounded-lg overflow-hidden ${
              type === templateType ? 'ring-2 ring-[--theater-gold]' : ''
            }`}
            onClick={() => onChange({ type: templateType, enabled })}
          >
            {renderPreview(templateType)}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <button className="px-4 py-2 bg-[--theater-gold] text-black rounded-lg">
                Seleziona
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ type, enabled: e.target.checked })}
            className="w-4 h-4 rounded accent-[--theater-gold]"
          />
          Mostra animazione ticket
        </label>
      </div>
    </div>
  );
};

export default TicketTemplateSettings;