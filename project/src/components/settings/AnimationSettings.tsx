import React from 'react';
import { motion } from 'framer-motion';
import { Film, Stamp, Settings } from 'lucide-react';
import type { IntroAnimationType, TicketStampType } from '../../types/animations';

interface AnimationSettingsProps {
  introType: IntroAnimationType;
  ticketStampType: TicketStampType;
  enabled: boolean;
  onUpdate: (settings: {
    introType: IntroAnimationType;
    ticketStampType: TicketStampType;
    enabled: boolean;
  }) => void;
}

const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  introType,
  ticketStampType,
  enabled,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Settings className="text-[--theater-gold]" />
        Impostazioni Animazioni
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-white flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onUpdate({
                introType,
                ticketStampType,
                enabled: e.target.checked
              })}
              className="w-4 h-4 rounded accent-[--theater-gold]"
            />
            Abilita Animazioni
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <Film size={16} />
              Animazione Introduttiva
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['curtain', 'fade', 'slide'] as IntroAnimationType[]).map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onUpdate({
                    introType: type,
                    ticketStampType,
                    enabled
                  })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    introType === type
                      ? 'border-[--theater-gold] bg-[--theater-gold]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <Film className={`w-8 h-8 mx-auto mb-2 ${
                      introType === type ? 'text-[--theater-gold]' : 'text-gray-400'
                    }`} />
                    <span className={introType === type ? 'text-white' : 'text-gray-400'}>
                      {type === 'curtain' && 'Sipario'}
                      {type === 'fade' && 'Dissolvenza'}
                      {type === 'slide' && 'Scorrimento'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 flex items-center gap-2">
              <Stamp size={16} />
              Animazione Timbro
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['classic', 'modern', 'vintage'] as TicketStampType[]).map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onUpdate({
                    introType,
                    ticketStampType: type,
                    enabled
                  })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    ticketStampType === type
                      ? 'border-[--theater-gold] bg-[--theater-gold]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <Stamp className={`w-8 h-8 mx-auto mb-2 ${
                      ticketStampType === type ? 'text-[--theater-gold]' : 'text-gray-400'
                    }`} />
                    <span className={ticketStampType === type ? 'text-white' : 'text-gray-400'}>
                      {type === 'classic' && 'Classico'}
                      {type === 'modern' && 'Moderno'}
                      {type === 'vintage' && 'Vintage'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationSettings;