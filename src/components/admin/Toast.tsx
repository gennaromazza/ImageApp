import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  duration?: number; // Durata in millisecondi (default: 3000ms)
}

const Toast: React.FC<ToastProps> = ({ message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50"
        >
          <span className="font-medium">{message}</span>
          <button onClick={() => setVisible(false)} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
