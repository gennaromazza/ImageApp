import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

interface PhotoViewerProps {
  photos: Array<{
    id: string;
    url: string;
    name: string;
  }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFavorite?: (photoId: string) => void;
  favorites?: string[];
  onShare?: (url: string) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onFavorite,
  favorites = [],
  onShare,
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [lastTap, setLastTap] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Handler per ingrandire
  const handleZoomIn = React.useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handler per ridurre
  const handleZoomOut = React.useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handler per resettare lo zoom
  const handleResetZoom = React.useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Calcola i limiti di trascinamento (drag constraints) quando zoom > 1
  const getDragConstraints = () => {
    if (!imageRef.current || !containerRef.current) return {};
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    const maxX = (imageRect.width * zoom - containerRect.width) / 2;
    const maxY = (imageRect.height * zoom - containerRect.height) / 2;
    return { left: -maxX, right: maxX, top: -maxY, bottom: maxY };
  };

  // Doppio tap per zoom su mobile
  const handleTouch = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      zoom === 1 ? handleZoomIn() : handleResetZoom();
    }
    setLastTap(now);
  };

  // Se zoom > 1, aggiorniamo la posizione di panning al termine del drag
  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    setIsDragging(false);
    if (zoom > 1) {
      setPosition((prev) => ({
        x: prev.x + info.offset.x,
        y: prev.y + info.offset.y,
      }));
    }
  };

  // Swipe handlers di react-swipeable (solo quando zoom === 1)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onNext(),
    onSwipedRight: () => onPrev(),
    preventScrollOnSwipe: true,
    trackMouse: true, // se vuoi abilitare swipe anche con mouse su desktop
  });

  // Navigazione con tastiera
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    },
    [onPrev, onNext, onClose, handleZoomIn, handleZoomOut]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset zoom al cambio foto
  React.useEffect(() => {
    handleResetZoom();
  }, [currentIndex, handleResetZoom]);

  if (!photos.length) return null;
  const currentPhoto = photos[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      >
      {/* Backdrop: cliccando chiude il viewer */}
<div className="absolute inset-0" onClick={onClose} />

{/* Contenuto interattivo */}
<div className="relative z-60">
  {/* Controlli in alto a destra */}
  <div
    className="fixed top-4 right-4 flex items-center gap-4 z-70"
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    <ControlButton onClick={handleZoomIn} label="Zoom In">
      <ZoomIn size={24} />
    </ControlButton>
    <ControlButton onClick={handleZoomOut} label="Zoom Out">
      <ZoomOut size={24} />
    </ControlButton>
    <ControlButton onClick={handleResetZoom} label="Reset Zoom">
      <RefreshCw size={24} />
    </ControlButton>
    <ControlButton onClick={() => onShare?.(currentPhoto.url)} label="Share">
      <Share2 size={24} />
    </ControlButton>
    <ControlButton
  onClick={async () => {
    try {
      // Scarichiamo il file come blob
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();

      // Creiamo un URL blob locale
      const blobURL = URL.createObjectURL(blob);

      // Creiamo un link "invisibile" e lo clicchiamo
      const link = document.createElement('a');
      link.href = blobURL;
      link.download = currentPhoto.name || 'download.jpg'; // Nome di default
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Rilasciamo l'URL blob
      URL.revokeObjectURL(blobURL);
    } catch (error) {
      console.error('Errore nel download:', error);
    }
  }}
  label="Download photo"
>
  <Download size={24} />
</ControlButton>


    <ControlButton onClick={onClose} label="Close">
      <X size={24} />
    </ControlButton>
  </div>


          {/* Bottoni di navigazione */}
          {currentIndex > 0 && <NavButton direction="left" onClick={onPrev} />}
          {currentIndex < photos.length - 1 && <NavButton direction="right" onClick={onNext} />}

          {/* Container dell'immagine */}
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative w-full h-full select-none flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '0 env(safe-area-inset-left) 0 env(safe-area-inset-right)' }}
          >
            {/* Se lo zoom è 1, usiamo swipeHandlers per gestire lo swipe con react-swipeable */}
            <motion.div
              {...(zoom === 1 ? swipeHandlers : {})}
              drag={zoom > 1}
              dragConstraints={zoom > 1 ? getDragConstraints() : {}}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouch}
              style={{
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none', // disabilita comportamento nativo per touch
                willChange: 'transform',
              }}
            >
              <motion.img
                ref={imageRef}
                src={currentPhoto.url}
                alt={currentPhoto.name}
                className="max-w-full max-h-[90vh] object-contain"
                animate={{
                  scale: zoom,
                  x: zoom > 1 ? position.x : 0,
                  y: zoom > 1 ? position.y : 0,
                  transition: { type: 'spring', stiffness: 300, damping: 30 },
                }}
              />
            </motion.div>

            {/* Bottone Preferiti */}
            {onFavorite && (
              <button
                onClick={() => onFavorite(currentPhoto.id)}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors active:scale-95"
                aria-label={
                  favorites.includes(currentPhoto.id)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <Heart
                  size={24}
                  className={
                    favorites.includes(currentPhoto.id)
                      ? 'text-red-500 fill-red-500'
                      : 'text-white'
                  }
                />
              </button>
            )}
          </motion.div>

          {/* Contatore foto */}
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800/80 rounded-full text-white z-70"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Indicatore zoom */}
          {zoom > 1 && (
            <div
              className="fixed bottom-4 left-4 px-4 py-2 bg-gray-800/80 rounded-full text-white text-sm z-70"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ControlButton: React.FC<{
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = React.memo(({ onClick, label, children }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors active:scale-95"
    aria-label={label}
  >
    {children}
  </button>
));

const NavButton: React.FC<{
  direction: 'left' | 'right';
  onClick: () => void;
}> = React.memo(({ direction, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`fixed z-70 p-3 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors active:scale-95 ${
      direction === 'left' ? 'left-4' : 'right-4'
    } top-1/2 -translate-y-1/2`}
    aria-label={direction === 'left' ? 'Previous photo' : 'Next photo'}
  >
    {direction === 'left' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
  </button>
));

export default React.memo(PhotoViewer);
