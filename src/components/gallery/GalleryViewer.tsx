import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Check,
  AlertCircle,
  Film,
  Share2,
  Download,
  X,
  CheckCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import PhotoViewer from './PhotoViewer';
import InfoSelection from './InfoSelection'; // Assicurati che il path sia corretto
import { toast } from 'react-hot-toast';

const GalleryViewer = () => {
  const { bookingId } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [selectionSaved, setSelectionSaved] = useState(false);

  // Stati per i vari modali
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [currentSelectionId, setCurrentSelectionId] = useState<string | null>(null);

  useEffect(() => {
    const loadGallery = async () => {
      if (!bookingId) return;
      setLoading(true);
      setError(null);
      try {
        // Carica dettagli booking
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) {
          setError('Galleria non trovata');
          return;
        }
        setBookingDetails(bookingDoc.data());

        // Carica foto
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

        // Carica eventuale selezione esistente
        const selectionsRef = collection(db, 'photo_selections');
        const selectionsQuery = query(selectionsRef, where('bookingId', '==', bookingId));
        const selectionsSnapshot = await getDocs(selectionsQuery);
        if (!selectionsSnapshot.empty) {
          const selectionDoc = selectionsSnapshot.docs[0].data();
          setSelectedPhotos(selectionDoc.photoIds || []);
          setSelectionSaved(true);
          setCurrentSelectionId(selectionsSnapshot.docs[0].id);
        }
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
    setSelectedPhotos(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
    setSelectionSaved(false);
  };

  const handleSaveSelection = async () => {
    if (!bookingId || selectedPhotos.length === 0) return;
    try {
      const selectionsRef = collection(db, 'photo_selections');
      const selectionsQuery = query(selectionsRef, where('bookingId', '==', bookingId));
      const selectionsSnapshot = await getDocs(selectionsQuery);
      let docIdToUse: string;
      if (!selectionsSnapshot.empty) {
        // Aggiorniamo la selezione esistente
        const existingSelection = selectionsSnapshot.docs[0];
        await updateDoc(doc(db, 'photo_selections', existingSelection.id), {
          photoIds: selectedPhotos,
          updatedAt: serverTimestamp()
        });
        docIdToUse = existingSelection.id;
      } else {
        // Creiamo una nuova selezione
        const newDoc = await addDoc(selectionsRef, {
          bookingId,
          photoIds: selectedPhotos,
          createdAt: serverTimestamp()
        });
        docIdToUse = newDoc.id;
      }
      setSelectionSaved(true);
      setCurrentSelectionId(docIdToUse);
      toast.success('Selezione salvata con successo!');
      setShowNotesPrompt(true);
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Errore nel salvataggio della selezione');
    }
  };

  const handleDeselectAll = () => {
    setSelectedPhotos([]);
    setSelectionSaved(false);
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

  const handleConfirmNotes = async (notes: { [photoId: string]: string }) => {
    if (!currentSelectionId) {
      setShowNotesModal(false);
      setShowThankYouModal(true);
      setTimeout(() => setShowThankYouModal(false), 3000);
      return;
    }
    try {
      await updateDoc(doc(db, 'photo_selections', currentSelectionId), { notes });
      toast.success('Note salvate!');
    } catch (err) {
      console.error('Errore nel salvataggio delle note:', err);
      toast.error('Impossibile salvare le note');
    } finally {
      setShowNotesModal(false);
      setShowThankYouModal(true);
      setTimeout(() => setShowThankYouModal(false), 3000);
    }
  };

  // Costruiamo l’elenco di foto selezionate per il componente InfoSelection
  const selectedPhotosObjects = photos.filter(p => selectedPhotos.includes(p.id));

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
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Film className="w-16 h-16 text-[--theater-gold] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">La tua Galleria Fotografica</h1>
          <p className="text-gray-400">Seleziona le tue foto preferite</p>
        </div>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div className="text-gray-400 text-center sm:text-left">
            {selectedPhotos.length} foto selezionate
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
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

        {/* Griglia delle Foto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                  className={`p-3 rounded-full transition-colors pointer-events-auto ${
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
                  className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors pointer-events-auto"
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

        {/* Photo Viewer (Lightbox) */}
        <AnimatePresence>
          {currentPhotoIndex !== null && (
            <PhotoViewer
              photos={photos}
              currentIndex={currentPhotoIndex}
              onClose={() => setCurrentPhotoIndex(null)}
              onNext={() =>
                setCurrentPhotoIndex(prev =>
                  prev !== null && prev < photos.length - 1 ? prev + 1 : prev
                )
              }
              onPrev={() =>
                setCurrentPhotoIndex(prev =>
                  prev !== null && prev > 0 ? prev - 1 : prev
                )
              }
              onFavorite={togglePhotoSelection}
              favorites={selectedPhotos}
            />
          )}
        </AnimatePresence>

        {/* Barra fissa in basso per azioni sulla selezione */}
        {selectedPhotos.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 bg-gray-800 p-4 border-t border-gray-700"
          >
            <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-white text-center">
                {selectedPhotos.length} foto selezionate
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDeselectAll}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X size={20} />
                  Deseleziona Tutto
                </button>
                <button
                  onClick={handleSaveSelection}
                  disabled={selectionSaved}
                  className="flex items-center gap-2 px-6 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  <Check size={20} />
                  {selectionSaved ? 'Selezione Salvata' : 'Conferma Selezione'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* MODAL PER IL PROMPT DELLE NOTE */}
      <AnimatePresence>
        {showNotesPrompt && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg w-11/12 max-w-md text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold mb-4">Selezione Completata</h3>
              <p className="mb-6">
                Vuoi aggiungere delle note per le foto per segnalarci ristampe o foto da regalare?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    setShowNotesPrompt(false);
                    setShowThankYouModal(true);
                    setTimeout(() => setShowThankYouModal(false), 3000);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  No, grazie
                </button>
                <button
                  onClick={() => {
                    setShowNotesPrompt(false);
                    setShowNotesModal(true);
                  }}
                  className="px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
                >
                  Clicca qui
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PER LE NOTE */}
      {showNotesModal && (
        <InfoSelection
          photos={selectedPhotosObjects}
          onConfirm={handleConfirmNotes}
          onCancel={() => setShowNotesModal(false)}
        />
      )}

      {/* MODAL DI RINGRAZIAMENTO */}
      <AnimatePresence>
        {showThankYouModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg w-11/12 max-w-md text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Grazie per aver scelto!</h3>
              <p className="text-gray-700">La tua selezione è stata salvata con successo.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(GalleryViewer);
