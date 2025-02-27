import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoViewer from './PhotoViewer';

interface InfoSelectionProps {
  photos: Array<{ id: string; url: string; name: string }>;
  initialNotes?: { [photoId: string]: string };
  onConfirm: (notes: { [photoId: string]: string }) => void;
  onCancel: () => void;
}

const InfoSelection: React.FC<InfoSelectionProps> = ({
  photos,
  initialNotes = {},
  onConfirm,
  onCancel,
}) => {
  const [notes, setNotes] = useState<{ [photoId: string]: string }>(initialNotes);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleChange = (photoId: string, value: string) => {
    setNotes(prev => ({ ...prev, [photoId]: value }));
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 p-6 rounded-lg w-11/12 max-w-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 text-white">
              Aggiungi / Modifica Note
            </h2>
            <p className="text-gray-400 mb-4">
              Inserisci una nota per ciascuna foto (es. "stampa aggiuntiva", "regalo per i nonni", ecc.).
            </p>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {photos.map((photo, index) => (
                <div key={photo.id} className="flex items-center gap-4">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-16 h-16 object-cover rounded cursor-pointer"
                    onClick={() => openViewer(index)}
                  />
                  <input
                    type="text"
                    placeholder="Esempio: stampa aggiuntiva, regalo per i nonni..."
                    value={notes[photo.id] || ''}
                    onChange={(e) => handleChange(photo.id, e.target.value)}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-[--theater-gold]"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Annulla
              </button>
              <button
                onClick={() => onConfirm(notes)}
                className="px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
              >
                Conferma note
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {isViewerOpen && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={() => setIsViewerOpen(false)}
          onNext={() =>
            setViewerIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev))
          }
          onPrev={() =>
            setViewerIndex((prev) => (prev > 0 ? prev - 1 : prev))
          }
        />
      )}
    </>
  );
};

export default InfoSelection;
