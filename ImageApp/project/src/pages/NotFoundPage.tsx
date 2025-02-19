import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-24 h-24 text-[--theater-gold]" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Pagina non trovata</h1>
        <p className="text-gray-400 mb-8">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
        >
          <Home size={20} />
          Torna alla Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;