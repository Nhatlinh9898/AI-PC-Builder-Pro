import React, { useState, useEffect } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight, PlayCircle, ShieldCheck, ShoppingBag, Youtube } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string; // Optional custom thumbnail for video
  source?: 'official' | 'retailer' | 'review' | string;
  quality?: string;
  alt?: string;
}

interface ImageGalleryProps {
  items?: MediaItem[];
  images?: string[]; // Legacy support
  productName: string;
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ items, images = [], productName }) => {
  // Normalize input to MediaItem[]
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    let normalized: MediaItem[] = [];
    if (items && items.length > 0) {
      normalized = items;
    } else if (images.length > 0) {
      normalized = images.map(url => ({ type: 'image', url, source: 'retailer' }));
    } else {
      normalized = [{ 
          type: 'image', 
          url: `https://placehold.co/600x600?text=${encodeURIComponent(productName)}`,
          source: 'placeholder'
      }];
    }
    setMediaItems(normalized);
    setSelectedIndex(0); // Reset index when items change
  }, [items, images, productName]);

  const activeItem = mediaItems[selectedIndex] || mediaItems[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  // Helper to render media content
  const renderContent = (item: MediaItem, inModal: boolean = false) => {
    if (item.type === 'video') {
      const ytId = getYoutubeId(item.url);
      if (ytId) {
        return (
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${ytId}?autoplay=${inModal ? 1 : 0}`} 
            title="Video player"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="rounded-lg w-full h-full"
          />
        );
      }
      return (
        <video 
            src={item.url} 
            controls 
            className="max-w-full max-h-full rounded-lg"
            poster={item.thumbnail}
        >
            Your browser does not support video tag.
        </video>
      );
    }
    return (
        <img 
          src={item.url} 
          alt={item.alt || `${productName} view`}
          className="max-w-full max-h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
    );
  };

  // Source Badge Helper
  const getSourceBadge = (source?: string) => {
      switch(source) {
          case 'official': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><ShieldCheck size={10} className="mr-1"/> Official</span>;
          case 'retailer': return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"><ShoppingBag size={10} className="mr-1"/> Retailer</span>;
          case 'review': return <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><Youtube size={10} className="mr-1"/> Review</span>;
          default: return null;
      }
  };

  if (mediaItems.length === 0) return null;

  return (
    <div className="space-y-4 select-none">
      {/* Main Display Area */}
      <div 
        className="relative group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 aspect-square flex items-center justify-center overflow-hidden"
      >
        {/* Render Active Content */}
        {renderContent(activeItem)}
        
        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
            <>
                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ChevronLeft size={24} />
                </button>
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 hover:bg-black/20 text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ChevronRight size={24} />
                </button>
            </>
        )}

        {/* Source Badge */}
        {activeItem.source && (
            <div className="absolute top-2 left-2 z-10 flex gap-1">
                <div className="text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center shadow-sm">
                    {getSourceBadge(activeItem.source)}
                </div>
                {activeItem.quality === 'high' && (
                    <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md">HQ</span>
                )}
            </div>
        )}

        {/* Zoom Icon (Only for images) */}
        {activeItem.type === 'image' && (
            <div 
                className="absolute bottom-2 right-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
            >
                <ZoomIn size={18} />
            </div>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {mediaItems.map((item, idx) => {
            const ytId = item.type === 'video' ? getYoutubeId(item.url) : null;
            const thumbUrl = ytId 
                ? `https://img.youtube.com/vi/${ytId}/default.jpg` 
                : (item.thumbnail || item.url);

            return (
                <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`
                    relative flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden bg-white dark:bg-slate-800
                    ${selectedIndex === idx ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'}
                `}
                >
                <img src={thumbUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <PlayCircle className="text-white opacity-80" size={20} />
                    </div>
                )}
                </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal (Images Only) */}
      {isZoomed && activeItem.type === 'image' && (
        <div 
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsZoomed(false)}
        >
            <button className="absolute top-4 right-4 text-white hover:text-slate-300 p-2">
                <X size={32} />
            </button>
            <img 
                src={activeItem.url} 
                alt="Zoomed View" 
                className="max-w-[95vw] max-h-[95vh] object-contain rounded-md shadow-2xl"
            />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;