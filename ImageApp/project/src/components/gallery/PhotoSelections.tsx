import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  AlertCircle,
  Image,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  Trash, // <--- IMPORT DELL'ICONA PER IL BOTTONE "Elimina"
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  updateDoc,
  deleteDoc, // <--- IMPORT DELLA FUNZIONE PER CANCELLARE IL DOCUMENTO
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import PhotoViewer from './PhotoViewer';

interface PhotoSelectionsProps {
  bookingId?: string;
}

const ITEMS_PER_PAGE = 10;

const PhotoSelections: React.FC<PhotoSelectionsProps> = ({ bookingId }) => {
  const [selections, setSelections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSelection, setSelectedSelection] = useState<any | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadSelections();
    } else {
      setLoading(false);
      setSelections([]);
    }
  }, [bookingId]);

  const loadSelections = async (nextPage = false) => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);

      let selectionsQuery = query(
        collection(db, 'photo_selections'),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (nextPage && lastDoc) {
        selectionsQuery = query(
          collection(db, 'photo_selections'),
          where('bookingId', '==', bookingId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(selectionsQuery);
      const selectionsData: Array<{
        id: string;
        photoIds: string[];
        photos: any[];
        createdAt: Date | null;
        viewed?: boolean;
      }> = [];

      for (const selectionDoc of snapshot.docs) {
        const selectionData = selectionDoc.data();
        const photoIds = selectionData.photoIds || [];

        // Fetch each photo individually
        const photos = [];
        for (const photoId of photoIds) {
          const photoDoc = await getDoc(doc(db, 'galleries', photoId));
          if (photoDoc.exists()) {
            photos.push({
              id: photoDoc.id,
              ...photoDoc.data(),
            });
          }
        }

        selectionsData.push({
          id: selectionDoc.id,
          photoIds,
          photos,
          createdAt: selectionData.createdAt?.toDate() || null,
          viewed: selectionData.viewed,
        });

        // Aggiorna lo stato di visualizzazione della selezione e del booking
        if (!selectionData.viewed) {
          try {
            await updateDoc(doc(db, 'photo_selections', selectionDoc.id), {
              viewed: true,
            });
            await updateDoc(doc(db, 'bookings', bookingId), {
              hasNewSelection: true,
            });
          } catch (error) {
            console.error('Error updating selection/booking status:', error);
          }
        }
      }

      if (nextPage) {
        setSelections((prev) => [...prev, ...selectionsData]);
      } else {
        setSelections(selectionsData);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading selections:', error);
      setError('Errore nel caricamento delle selezioni');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (selection: any) => {
    try {
      const photoNames = selection.photos.map((photo: any) => photo.name).join('\n');
      const blob = new Blob([photoNames], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selection-${selection.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Selezione esportata con successo');
    } catch (error) {
      console.error('Error exporting selection:', error);
      toast.error('Errore durante l\'esportazione');
    }
  };

  // FUNZIONE PER CANCELLARE UNA SELEZIONE DA FIRESTORE
  const handleDeleteSelection = async (selectionId: string) => {
    const conferma = window.confirm(
      'Sei sicuro di voler eliminare questa selezione?'
    );
    if (!conferma) return;

    try {
      await deleteDoc(doc(db, 'photo_selections', selectionId));
      setSelections((prev) => prev.filter((sel) => sel.id !== selectionId));
      toast.success('Selezione eliminata con successo');
    } catch (error) {
      console.error('Error deleting selection:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  if (loading && selections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-[--theater-gold] text-4xl">⌛</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  if (!bookingId) {
    return (
      <div className="text-center text-gray-400 py-8">
        Seleziona una prenotazione per visualizzare le selezioni
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedSelection ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedSelection(null);
                  setCurrentPhotoIndex(null); // reset della lightbox
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                Torna alle selezioni
              </button>
              <div className="flex items-center gap-4">
                {selectedSelection.createdAt && (
                  <span className="text-gray-400">
                    {format(selectedSelection.createdAt, 'dd MMMM yyyy HH:mm', {
                      locale: it,
                    })}
                  </span>
                )}
                <button
                  onClick={() => handleExport(selectedSelection)}
                  className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500"
                >
                  <Download size={18} />
                  Esporta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedSelection.photos.map((photo: any, index: number) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square cursor-pointer"
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={photo.url}
                      download
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={20} className="text-white" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Integrazione Lightbox */}
            {currentPhotoIndex !== null && (
              <PhotoViewer
                photos={selectedSelection.photos}
                currentIndex={currentPhotoIndex}
                onClose={() => setCurrentPhotoIndex(null)}
                onNext={() =>
                  setCurrentPhotoIndex((prev) =>
                    prev !== null && prev < selectedSelection.photos.length - 1
                      ? prev + 1
                      : prev
                  )
                }
                onPrev={() =>
                  setCurrentPhotoIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : prev
                  )
                }
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {selections.map((selection) => (
              <motion.div
                key={selection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-700 rounded-lg overflow-hidden transition-all ${
                  !selection.viewed ? 'ring-2 ring-[--theater-gold]' : ''
                }`}
              >
                <div className="p-4 flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[--theater-gold]" />
                      {selection.createdAt && (
                        <span className="text-gray-300">
                          {format(selection.createdAt, 'dd MMMM yyyy HH:mm', {
                            locale: it,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Image size={16} className="text-[--theater-gold]" />
                      <span className="text-white">
                        {selection.photos.length} foto selezionate
                      </span>
                    </div>
                    {!selection.viewed && (
                      <div className="flex items-center gap-1 text-[--theater-gold]">
                        <EyeOff size={14} />
                        <span className="text-sm">Non visualizzata</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSelection(selection)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                    >
                      <Eye size={16} />
                      Visualizza
                    </button>
                    <button
                      onClick={() => handleExport(selection)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[--theater-gold] text-black rounded hover:bg-yellow-500 transition-colors"
                    >
                      <Download size={16} />
                      Esporta
                    </button>
                    {/* NUOVO BOTTONE PER ELIMINARE LA SELEZIONE */}
                    <button
                      onClick={() => handleDeleteSelection(selection.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                    >
                      <Trash size={16} />
                      Elimina
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-4 overflow-x-auto">
                  <div className="flex gap-4 snap-x snap-mandatory">
                    {selection.photos.map((photo: any) => (
                      <div
                        key={photo.id}
                        className="flex-none w-24 h-24 snap-start"
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {selections.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nessuna selezione trovata</p>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => loadSelections(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin">⌛</span>
                  ) : (
                    <>
                      <ChevronDown size={20} />
                      Carica altre
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoSelections;
