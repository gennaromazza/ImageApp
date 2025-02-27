import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Classe aggiuntiva per lo stile personalizzato del contenuto
   * Esempio: "w-80" o "max-w-xl"
   */
  className?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Chiude il modal cliccando sullo sfondo (overlay)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className={`bg-gray-800 p-6 rounded-lg ${className || ''}`}
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BaseModal;
