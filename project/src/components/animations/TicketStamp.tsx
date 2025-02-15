import React from 'react';
import { motion } from 'framer-motion';
import type { TicketStampType } from '../../types/animations';

interface TicketStampProps {
  type: TicketStampType;
  ticketNumber: string;
  onComplete: () => void;
}

const TicketStamp: React.FC<TicketStampProps> = ({
  type,
  ticketNumber,
  onComplete
}) => {
  const animations = {
    classic: {
      stamp: {
        initial: { scale: 2, opacity: 0, rotate: -45 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        transition: { type: 'spring', damping: 12 }
      },
      text: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.5 }
      }
    },
    modern: {
      container: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      },
      stamp: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', damping: 20 }
      },
      circle: {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 1, ease: 'easeInOut' }
      }
    },
    vintage: {
      container: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 }
      },
      stamp: {
        initial: { scale: 1.5, opacity: 0, y: -50 },
        animate: { scale: 1, opacity: 1, y: 0 },
        transition: { type: 'spring', damping: 15 }
      }
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (type === 'classic') {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          {...animations.classic.stamp}
          className="bg-red-600 text-white p-8 rounded-lg shadow-xl transform"
        >
          <motion.div {...animations.classic.text}>
            <h2 className="text-2xl font-bold mb-2">Prenotazione Confermata!</h2>
            <p className="text-lg">Ticket #{ticketNumber}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (type === 'modern') {
    return (
      <motion.div
        {...animations.modern.container}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      >
        <motion.div
          {...animations.modern.stamp}
          className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-xl shadow-2xl text-white"
        >
          <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 100 100">
            <motion.circle
              {...animations.modern.circle}
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <motion.path
              {...animations.modern.circle}
              d="M 30 50 L 45 65 L 70 35"
              stroke="white"
              strokeWidth="3"
              fill="none"
            />
          </svg>
          <h2 className="text-2xl font-bold text-center mb-2">Confermato</h2>
          <p className="text-center opacity-90">#{ticketNumber}</p>
        </motion.div>
      </motion.div>
    );
  }

  // Vintage style
  return (
    <motion.div
      {...animations.vintage.container}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
    >
      <motion.div
        {...animations.vintage.stamp}
        className="bg-[#f8e5b9] p-8 rounded-lg border-4 border-[#8b4513] shadow-xl transform"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M0 0h20L0 20z"/%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        <div className="text-[#8b4513] text-center">
          <h2 className="text-3xl font-serif mb-2">APPROVATO</h2>
          <div className="w-full h-px bg-[#8b4513] my-2" />
          <p className="font-mono">{ticketNumber}</p>
          <div className="w-full h-px bg-[#8b4513] my-2" />
          <p className="text-sm font-serif">Carnevale Cinematografico</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TicketStamp;