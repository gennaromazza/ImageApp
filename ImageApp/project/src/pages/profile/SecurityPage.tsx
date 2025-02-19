import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import SecuritySettings from '../../components/profile/SecuritySettings';

const SecurityPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="text-[--theater-gold]" />
          Sicurezza
        </h2>

        <SecuritySettings />
      </div>
    </motion.div>
  );
};

export default SecurityPage;