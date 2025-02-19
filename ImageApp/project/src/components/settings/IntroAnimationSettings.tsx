import React from 'react';
import { Film, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import type { IntroAnimationType } from '../../types/animations';

interface IntroAnimationSettingsProps {
  enabled: boolean;
  title: string;
  subtitle: string;
  type: IntroAnimationType;
  onChange: (settings: {
    enabled: boolean;
    title: string;
    subtitle: string;
    type: IntroAnimationType;
  }) => void;
}

const IntroAnimationSettings: React.FC<IntroAnimationSettingsProps> = ({
  enabled,
  title,
  subtitle,
  type,
  onChange
}) => {
  const animationTypes = [
    {
      id: 'curtain' as const,
      label: 'Sipario',
      description: 'Un elegante sipario teatrale che si apre per rivelare il contenuto'
    },
    {
      id: 'fade' as const,
      label: 'Dissolvenza',
      description: 'Una transizione fluida con dissolvenza del contenuto'
    },
    {
      id: 'slide' as const,
      label: 'Scorrimento',
      description: 'Un effetto dinamico di scorrimento laterale'
    }
  ];

  const handleChange = (field: keyof IntroAnimationSettingsProps) => (value: any) => {
    onChange({
      enabled,
      title,
      subtitle,
      type,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Film className="text-[--theater-gold]" />
        Animazione Introduttiva
      </h3>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleChange('enabled')(e.target.checked)}
              className="w-4 h-4 rounded accent-[--theater-gold]"
            />
            Mostra animazione all'apertura
          </label>
        </div>

        {enabled && (
          <>
            <div>
              <label className="block text-gray-300 mb-2">Titolo Animazione</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleChange('title')(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Carnevale 2025"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Sottotitolo</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => handleChange('subtitle')(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="3... 2... 1..."
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-4">Tipo Animazione</label>
              <div className="grid grid-cols-3 gap-4">
                {animationTypes.map((animation) => (
                  <motion.button
                    key={animation.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleChange('type')(animation.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      type === animation.id
                        ? 'border-[--theater-gold] bg-[--theater-gold]/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Play className={`w-8 h-8 mx-auto mb-2 ${
                      type === animation.id ? 'text-[--theater-gold]' : 'text-gray-400'
                    }`} />
                    <span className={`block font-medium mb-2 ${
                      type === animation.id ? 'text-white' : 'text-gray-300'
                    }`}>
                      {animation.label}
                    </span>
                    <p className="text-sm text-gray-400">
                      {animation.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-4">Anteprima Impostazioni</h4>
          <div className="space-y-2 text-gray-300">
            <p><strong>Stato:</strong> {enabled ? 'Attivo' : 'Disattivato'}</p>
            <p><strong>Titolo:</strong> {title || '(non impostato)'}</p>
            <p><strong>Sottotitolo:</strong> {subtitle || '(non impostato)'}</p>
            <p><strong>Tipo:</strong> {animationTypes.find(a => a.id === type)?.label || type}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimationSettings;