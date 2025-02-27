import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Search,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Link2,
  Loader2,
  X,
  Check,
  Download,
  Trash2,
  Share2,
  MessageSquare,
  Eye,
  FileText
} from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import PhotoViewer from './PhotoViewer';
import PhotoSelections from './PhotoSelections';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const STORAGE_BUCKET = 'gs://cinema-70fbc.firebasestorage.app';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 1920;

interface GalleryManagerProps {
  bookingId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ bookingId, isOpen = true, onClose }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'selections'>('photos');

  useEffect(() => {
    const loadBookingDetails = async () => {
      if (!bookingId) return;
      try {
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingDoc.exists()) {
          setBookingDetails(bookingDoc.data());
        }
      } catch (error) {
        console.error('Error loading booking details:', error);
      }
    };
    loadBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!bookingId) return;
      setLoading(true);
      setError(null);
      try {
        const photosRef = collection(db, 'galleries');
        const q = query(
          photosRef,
          where('bookingId', '==', bookingId),
          orderBy('uploadedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const photosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate()
        }));
        setPhotos(photosData);
      } catch (error) {
        console.error('Error loading photos:', error);
        setError('Errore durante il caricamento delle foto');
        toast.error('Errore nel caricamento delle foto');
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, [bookingId]);

  const checkAndWarnImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > MAX_FILE_SIZE) {
        toast(`Attenzione: ${file.name} supera i 5MB. Tenterò di comprimerla...`, { icon: '⚠️' });
      }
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
          toast(`Attenzione: ${file.name} supera ${MAX_IMAGE_DIMENSION}px. Ridimensiono...`, { icon: '⚠️' });
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error(`Errore nel caricamento di ${file.name}`);
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!bookingId || !event.target.files?.length) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setCompressionProgress(0);
    try {
      const files = Array.from(event.target.files);
      const validFiles: File[] = [];
      for (const file of files) {
        const canProcess = await checkAndWarnImage(file);
        if (canProcess) validFiles.push(file);
      }
      if (validFiles.length === 0) {
        toast.error('Nessun file valido da caricare');
        setUploading(false);
        return;
      }
      const totalFiles = validFiles.length;
      let completedFiles = 0;
      for (const file of validFiles) {
        toast(`Comprimo: ${file.name}`, { icon: '🗜️' });
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => setCompressionProgress(progress)
        });
        const storageRef = ref(storage, `${STORAGE_BUCKET}/galleries/${bookingId}/${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        const downloadUrl = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'galleries'), {
          bookingId,
          url: downloadUrl,
          name: file.name,
          uploadedAt: new Date()
        });
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
        toast.success(`Foto ${completedFiles}/${totalFiles} caricata`);
      }
      // Ricarica la lista delle foto
      const photosRef = collection(db, 'galleries');
      const q = query(
        photosRef,
        where('bookingId', '==', bookingId),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate()
      }));
      setPhotos(photosData);
      setUploadProgress(0);
      setCompressionProgress(0);
      toast.success('Tutte le foto sono state caricate con successo!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Errore durante il caricamento delle foto');
      setError('Errore durante il caricamento delle foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!bookingId) return;
    try {
      const storageRef = ref(storage, `${STORAGE_BUCKET}/galleries/${bookingId}/${photo.name}`);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'galleries', photo.id));
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.success('Foto eliminata con successo');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Errore durante l\'eliminazione della foto');
    }
  };

  const handleClearGallery = async () => {
    if (!bookingId || photos.length === 0) return;
    if (!window.confirm("Sei sicuro di voler svuotare la galleria? Questa operazione non può essere annullata.")) {
      return;
    }
    setUploading(true);
    try {
      await Promise.all(
        photos.map(async (photo) => {
          const storageRef = ref(storage, `${STORAGE_BUCKET}/galleries/${bookingId}/${photo.name}`);
          await deleteObject(storageRef);
          await deleteDoc(doc(db, 'galleries', photo.id));
        })
      );
      setPhotos([]);
      toast.success("Galleria svuotata con successo!");
    } catch (error) {
      console.error("Errore durante lo svuotamento della galleria", error);
      toast.error("Errore durante lo svuotamento della galleria");
    } finally {
      setUploading(false);
    }
  };

  const buildGalleryUrl = () => {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    let pathSegments = currentPath.split('/').filter(Boolean);
    const dashboardIndex = pathSegments.indexOf('dashboard');
    if (dashboardIndex >= 0) pathSegments.splice(dashboardIndex, 1);
    const galleryIndex = pathSegments.indexOf('gallery');
    if (galleryIndex >= 0) pathSegments.splice(galleryIndex, 2);
    pathSegments.push('gallery', bookingId as string);
    return `${baseUrl}/${pathSegments.join('/')}`;
  };

  const handleShareGallery = () => {
    if (!bookingDetails?.phone) {
      toast.error('Numero di telefono non disponibile');
      return;
    }
    const galleryUrl = buildGalleryUrl();
    const message = `Ciao ${bookingDetails.firstName}, ecco il link alla tua galleria fotografica: ${galleryUrl}`;
    const whatsappUrl = `https://wa.me/${bookingDetails.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Link condiviso su WhatsApp');
  };

  const openGallery = () => {
    const galleryUrl = buildGalleryUrl();
    window.open(galleryUrl, '_blank');
    toast.success('Galleria aperta in una nuova scheda');
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6">
      <div className="max-w-screen-xl mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                <Image className="text-[--theater-gold]" />
                Gestione Galleria
              </h2>
              {bookingDetails && (
                <div className="space-y-1">
                  <p className="text-gray-300 flex items-center gap-2">
                    <User size={16} className="text-[--theater-gold]" />
                    {bookingDetails.firstName} {bookingDetails.lastName}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <Calendar size={16} className="text-[--theater-gold]" />
                    {bookingDetails.booking_date} {bookingDetails.booking_time}
                  </p>
                  <p className="text-gray-300 flex items-center gap-2">
                    <Phone size={16} className="text-[--theater-gold]" />
                    {bookingDetails.phone}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {bookingDetails?.phone && (
                <button
                  onClick={handleShareGallery}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MessageSquare size={20} />
                  Condividi su WhatsApp
                </button>
              )}
              <button
                onClick={openGallery}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye size={20} />
                Visualizza Galleria
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'photos'
                  ? 'text-[--theater-gold] border-b-2 border-[--theater-gold]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image size={20} />
                Foto
              </div>
            </button>
            <button
              onClick={() => setActiveTab('selections')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'selections'
                  ? 'text-[--theater-gold] border-b-2 border-[--theater-gold]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                Selezioni
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {activeTab === 'photos' ? (
          <>
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h3 className="text-lg font-medium text-white">Carica Foto</h3>
                  {photos.length > 0 && (
                    <span className="text-sm text-gray-400">
                      {photos.length} foto caricate
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearGallery}
                  disabled={uploading || photos.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={20} />
                  Svuota Galleria
                </button>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[--theater-gold] file:text-black
                  hover:file:bg-yellow-500
                  disabled:opacity-50"
              />
              {uploading && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Compressione in corso... {Math.round(compressionProgress)}%
                    </p>
                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-[--theater-gold]"
                        initial={{ width: 0 }}
                        animate={{ width: `${compressionProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Caricamento su Firebase... {Math.round(uploadProgress)}%
                    </p>
                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div className="relative pt-[100%]">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="absolute inset-0 w-full h-full object-contain bg-gray-800 rounded-lg cursor-pointer"
                      onClick={() => setCurrentPhotoIndex(index)}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a
                      href={photo.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      <Download size={20} />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo);
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {photos.length === 0 && !loading && (
              <div className="text-center text-gray-400 py-8">
                Nessuna foto caricata
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
            <PhotoSelections bookingId={bookingId} />
          </div>
        )}

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
          />
        )}
      </div>
    </div>
  );
};

export default GalleryManager;
