import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Share2, Download, ZoomIn, ZoomOut } from 'lucide-react';

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
  onShare
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const currentPhoto = photos[currentIndex];
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
    setPosition({ x: 0, y: 0 }); // Reset position on zoom
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
    setPosition({ x: 0, y: 0 }); // Reset position on zoom
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    if (zoom === 1) {
      const threshold = 50; // Minimum drag distance for navigation
      if (info.offset.x > threshold) {
        onPrev();
      } else if (info.offset.x < -threshold) {
        onNext();
      }
    } else {
      setPosition({
        x: position.x + info.offset.x,
        y: position.y + info.offset.y
      });
    }
  };

  const handleShare = () => {
    if (onShare && currentPhoto) {
      onShare(currentPhoto.url);
    } else {
      // Fallback to native sharing if available
      if (navigator.share) {
        navigator.share({
          title: 'Condividi foto',
          url: currentPhoto.url
        }).catch(console.error);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset zoom and position when changing photos
  React.useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="fixed top-4 right-4 flex items-center gap-4 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <Share2 size={20} />
          </button>
          <a
            href={currentPhoto.url}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <Download size={20} />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="fixed left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="fixed right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Image Container */}
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="relative w-full h-full select-none flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            drag={zoom > 1}
            dragConstraints={containerRef}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            <motion.img
              src={currentPhoto.url}
              alt={currentPhoto.name}
              className="max-w-full max-h-[90vh] object-contain"
              style={{
                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              onDoubleClick={() => {
                if (zoom === 1) {
                  handleZoomIn();
                } else {
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }
              }}
            />
          </motion.div>

          {onFavorite && (
            <button
              onClick={() => onFavorite(currentPhoto.id)}
              className="absolute bottom-4 right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <Heart
                size={24}
                className={favorites.includes(currentPhoto.id) ? 'text-red-500 fill-red-500' : 'text-white'}
              />
            </button>
          )}
        </motion.div>

        {/* Photo Counter */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800/80 rounded-full text-white">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Zoom Info */}
        {zoom > 1 && (
          <div className="fixed bottom-4 left-4 px-4 py-2 bg-gray-800/80 rounded-full text-white text-sm">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoViewer;