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
  Trash,
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
  deleteDoc,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import PhotoViewer from './PhotoViewer';
import InfoSelection from './InfoSelection';

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

  // Selezione visualizzata in dettaglio
  const [selectedSelection, setSelectedSelection] = useState<any | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);

  // Modal per modificare le note
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectionForNotes, setSelectionForNotes] = useState<any | null>(null);
//Modale per selezione Nome foto singola

const [exportPhotos, setExportPhotos] = useState<any[]>([]);
const [activeTab, setActiveTab] = useState<'lightroom' | 'individual'>('lightroom');
  // Nuovo stato per mostrare il modal di "esportazione"
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportText, setExportText] = useState('');

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
        notes?: { [photoId: string]: string };
      }> = [];

      for (const selectionDoc of snapshot.docs) {
        const selectionData = selectionDoc.data();
        const photoIds = selectionData.photoIds || [];

        // Fetch each photo individualmente
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
          notes: selectionData.notes || {},
        });

        // Aggiorna lo stato di visualizzazione
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

  // Invece di scaricare un file di testo, apriamo un modal
  // con i nomi dei file separati da virgola
  const handleExport = (selection: any) => {
    try {
      const photoNames = selection.photos.map((photo: any) => photo.name).join(',');
      setExportText(photoNames);
      setExportPhotos(selection.photos);
      setActiveTab('lightroom'); // reset del tab ad ogni esportazione
      setShowExportModal(true);
    } catch (error) {
      console.error('Error exporting selection:', error);
      toast.error("Errore durante l'esportazione");
    }
  };
  
  // FUNZIONE PER CANCELLARE UNA SELEZIONE DA FIRESTORE
  const handleDeleteSelection = async (selectionId: string) => {
    const conferma = window.confirm('Sei sicuro di voler eliminare questa selezione?');
    if (!conferma) return;

    try {
      await deleteDoc(doc(db, 'photo_selections', selectionId));
      setSelections((prev) => prev.filter((sel) => sel.id !== selectionId));
      toast.success('Selezione eliminata con successo');
    } catch (error) {
      console.error('Error deleting selection:', error);
      toast.error("Errore durante l'eliminazione");
    }
  };

  // Apertura del modal "InfoSelection" per modificare note
  const handleOpenNotesModal = (selection: any) => {
    setSelectionForNotes(selection);
    setShowNotesModal(true);
  };

  // Salvataggio note su Firestore
  const handleConfirmNotes = async (notes: { [photoId: string]: string }) => {
    if (!selectionForNotes) return;

    try {
      await updateDoc(doc(db, 'photo_selections', selectionForNotes.id), { notes });
      toast.success('Note aggiornate con successo!');

      // Aggiorna lo state locale
      setSelections((prev) =>
        prev.map((sel) =>
          sel.id === selectionForNotes.id
            ? { ...sel, notes }
            : sel
        )
      );
    } catch (err) {
      console.error('Errore salvataggio note:', err);
      toast.error('Impossibile salvare le note');
    }

    setShowNotesModal(false);
    setSelectionForNotes(null);
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
            {/* Dettaglio selezione */}
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

            {/* Elenco foto della selezione */}
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

            {/* Lightbox (PhotoViewer) */}
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
            {/* Lista di tutte le selezioni */}
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
                    <button
                      onClick={() => handleDeleteSelection(selection.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                    >
                      <Trash size={16} />
                      Elimina
                    </button>
                    {/* Pulsante per aprire il modal delle note */}
                    <button
                      onClick={() => handleOpenNotesModal(selection)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                    >
                      Note
                    </button>
                  </div>
                </div>

                {/* Preview thumbnails */}
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

      {/* Modal InfoSelection per aggiungere/modificare note */}
      {showNotesModal && selectionForNotes && (
        <InfoSelection
          photos={selectionForNotes.photos}
          initialNotes={selectionForNotes.notes}
          onConfirm={handleConfirmNotes}
          onCancel={() => {
            setShowNotesModal(false);
            setSelectionForNotes(null);
          }}
        />
      )}

      {/* MODAL con la lista dei nomi dei file separati da virgola */}
      <AnimatePresence>
  {showExportModal && (
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
        <h3 className="text-xl font-bold mb-4 text-white">Lista per Lightroom</h3>

        {/* Navigazione a Tab */}
        <div className="mb-4 flex border-b border-gray-600">
          <button
            className={`px-4 py-2 ${
              activeTab === 'lightroom'
                ? 'border-b-2 border-[--theater-gold] text-white'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('lightroom')}
          >
            Lightroom
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'individual'
                ? 'border-b-2 border-[--theater-gold] text-white'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('individual')}
          >
            Individuali
          </button>
        </div>

        {activeTab === 'lightroom' ? (
          <>
            <p className="text-gray-400 mb-4">
              Copia i nomi dei file e incollali nel campo "Import" di Lightroom (o dove vuoi).
            </p>
            <textarea
              value={exportText}
              readOnly
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full h-32 p-2 bg-gray-700 text-white rounded resize-none border border-gray-600 focus:outline-none mb-4"
            />
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-4">
              Copia il nome per ogni singola foto.
            </p>
            <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
              {exportPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <span className="text-white">{photo.name}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard
                        .writeText(photo.name)
                        .then(() => toast.success('Copiato negli appunti!'))
                        .catch(() => toast.error('Errore nella copia'));
                    }}
                    className="px-3 py-1 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
                  >
                    Copia
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-4">
          {activeTab === 'lightroom' && (
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(exportText)
                  .then(() => toast.success('Copiato negli appunti!'))
                  .catch(() => toast.error('Errore nella copia'));
              }}
              className="px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
            >
              Copia
            </button>
          )}
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Chiudi
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
};

export default PhotoSelections;
