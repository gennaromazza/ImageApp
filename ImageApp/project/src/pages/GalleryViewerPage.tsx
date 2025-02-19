import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, AlertCircle, Film, Share2, Download } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, doc, getDoc } from 'firebase/firestore';
import PhotoViewer from '../components/gallery/PhotoViewer';
import { toast } from 'react-hot-toast';

const GalleryViewerPage = () => {
  const { bookingId } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [selectionSaved, setSelectionSaved] = useState(false);

  useEffect(() => {
    const loadGallery = async () => {
      if (!bookingId) return;

      setLoading(true);
      setError(null);

      try {
        // Carica i dettagli della prenotazione
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) {
          setError('Galleria non trovata');
          return;
        }
        setBookingDetails(bookingDoc.data());

        // Carica le foto
        const photosRef = collection(db, 'galleries');
        const q = query(
          photosRef,
          where('bookingId', '==', bookingId),
          orderBy('uploadedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const photosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPhotos(photosData);
      } catch (error) {
        console.error('Error loading gallery:', error);
        setError('Errore nel caricamento della galleria');
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [bookingId]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
    setSelectionSaved(false);
  };

  const handleSaveSelection = async () => {
    if (!bookingId || selectedPhotos.length === 0) return;

    try {
      await addDoc(collection(db, 'photo_selections'), {
        bookingId,
        photoIds: selectedPhotos,
        createdAt: new Date()
      });

      setSelectionSaved(true);
      toast.success('Selezione salvata con successo!');
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Errore nel salvataggio della selezione');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'La mia galleria fotografica',
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copiato negli appunti'))
        .catch(() => toast.error('Errore nella copia del link'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin text-[--theater-gold] text-4xl">⌛</div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-lg max-w-md w-full flex items-center gap-3">
          <AlertCircle size={24} />
          <p>{error || 'Galleria non trovata'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Film className="w-16 h-16 text-[--theater-gold] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            La tua Galleria Fotografica
          </h1>
          <p className="text-gray-400">
            Seleziona le tue foto preferite
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-gray-400">
            {selectedPhotos.length} foto selezionate
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Share2 size={20} />
              Condividi
            </button>
            {selectedPhotos.length > 0 && (
              <button
                onClick={handleSaveSelection}
                disabled={selectionSaved}
                className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                <Check size={20} />
                {selectionSaved ? 'Selezione Salvata' : 'Conferma Selezione'}
              </button>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                onClick={() => setCurrentPhotoIndex(index)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                  className={`p-3 rounded-full transition-colors ${
                    selectedPhotos.includes(photo.id)
                      ? 'bg-[--theater-gold] text-black'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart
                    size={24}
                    className={selectedPhotos.includes(photo.id) ? 'fill-current' : ''}
                  />
                </button>
                <a
                  href={photo.url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                >
                  <Download size={24} />
                </a>
              </div>
              {selectedPhotos.includes(photo.id) && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-[--theater-gold] rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-black" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Photo Viewer */}
        <AnimatePresence>
          {currentPhotoIndex !== null && (
            <PhotoViewer
              photos={photos}
              currentIndex={currentPhotoIndex}
              onClose={() => setCurrentPhotoIndex(null)}
              onNext={() => setCurrentPhotoIndex(prev => 
                prev !== null && prev < photos.length - 1 ? prev + 1 : prev
              )}
              onPrev={() => setCurrentPhotoIndex(prev => 
                prev !== null && prev > 0 ? prev - 1 : prev
              )}
              onFavorite={togglePhotoSelection}
              favorites={selectedPhotos}
            />
          )}
        </AnimatePresence>

        {/* Fixed Selection Bar */}
        {selectedPhotos.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 bg-gray-800 p-4 border-t border-gray-700"
          >
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-white">
                {selectedPhotos.length} foto selezionate
              </div>
              <button
                onClick={handleSaveSelection}
                disabled={selectionSaved}
                className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                <Check size={20} />
                {selectionSaved ? 'Selezione Salvata' : 'Conferma Selezione'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GalleryViewerPage;