import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Download, Link2, Info, Check, CheckCircle, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface LightboxProps {
  isOpen: boolean;
  asset: {
    id: string;
    filename: string;
    path: string;
    thumbnailPath?: string;
    mimeType: string;
    metadata?: any;
  } | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function Lightbox({
  isOpen,
  asset,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  isFavorite = false,
  onFavoriteToggle,
}: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef<HTMLDivElement>(null);
  
  const [showMetadata, setShowMetadata] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Touch state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Constants
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.5;

  // Reset zoom when asset changes
  useEffect(() => {
    if (asset) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoading(true);
      setImageError(false);
      setIsDragging(false);
      console.log('📸 Loading image:', asset.filename);
    }
  }, [asset?.id]);

  // Reset metadata when asset changes
  useEffect(() => {
    setShowMetadata(false);
  }, [asset?.id]);

  // Click outside metadata to close
  useEffect(() => {
    if (!showMetadata) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (metadataRef.current && !metadataRef.current.contains(e.target as Node)) {
        setShowMetadata(false);
        console.log('📋 Metadata closed (click outside)');
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMetadata]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          if (showMetadata) {
            setShowMetadata(false);
          } else if (zoom > 1) {
            handleZoomReset();
          } else {
            onClose();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          if (hasNext && onNext) {
            onNext();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          if (hasPrevious && onPrevious) {
            onPrevious();
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowMetadata(prev => !prev);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          handleZoomToggle();
          break;
        case '0':
          e.preventDefault();
          handleZoomReset();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, showMetadata, zoom, onClose, onNext, onPrevious, hasNext, hasPrevious]);

  // Mouse wheel zoom (Ctrl + scroll)
  useEffect(() => {
    if (!isOpen || !imageContainerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl/Cmd held
      
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
      
      setZoom(newZoom);
      
      if (newZoom <= MIN_ZOOM) {
        setPosition({ x: 0, y: 0 });
      }
      
      console.log('🖱️ Wheel zoom:', Math.round(newZoom * 100) + '%');
    };

    const container = imageContainerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, zoom]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      containerRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, asset?.id, showMetadata]);

  if (!isOpen || !asset) return null;

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  const handleImageClick = () => {
    if (zoom === 1) {
      setZoom(2);
      console.log('🔍 Click zoom to 200%');
    } else {
      handleZoomReset();
    }
  };

  const handleImageDoubleClick = () => {
    if (zoom === 1) {
      setZoom(3);
      console.log('🔍 Double-click zoom to 300%');
    } else {
      handleZoomReset();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    console.log('🔍 Zoom in');
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setZoom(newZoom);
    if (newZoom <= MIN_ZOOM) {
      setPosition({ x: 0, y: 0 });
    }
    console.log('🔍 Zoom out');
  };

  const handleZoomReset = () => {
    setZoom(MIN_ZOOM);
    setPosition({ x: 0, y: 0 });
    console.log('🔍 Zoom reset');
  };

  const handleZoomToggle = () => {
    if (zoom === MIN_ZOOM) {
      setZoom(2);
    } else {
      handleZoomReset();
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= MIN_ZOOM) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= MIN_ZOOM) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for pinch-to-zoom and pan
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
      console.log('🤏 Pinch started');
    } else if (e.touches.length === 1 && zoom > MIN_ZOOM) {
      // Pan
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom * scale));
      setZoom(newZoom);
      
      if (newZoom <= MIN_ZOOM) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && touchStart && zoom > MIN_ZOOM) {
      // Pan
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDistance(null);
    setTouchStart(null);
    if (zoom !== MIN_ZOOM && zoom !== initialZoom) {
      console.log('🤏 Pinch ended at', Math.round(zoom * 100) + '%');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      console.log('✅ Link copied to clipboard');
    } catch (err) {
      console.error('❌ Failed to copy link:', err);
    }
  };

  const handleDownload = async () => {
    console.log('📥 Download initiated for:', asset.filename);
    setDownloading(true);
    setDownloadSuccess(false);
    
    try {
      // Fetch the image
      const response = await fetch(asset.path);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.filename || 'photo.jpg';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download complete:', asset.filename);
      setDownloading(false);
      setDownloadSuccess(true);
      
      // Reset success indicator after 2 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('❌ Download failed:', error);
      setDownloading(false);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❤️ Lightbox favorite clicked - Asset:', asset.id, 'Current isFavorite prop:', isFavorite);
    onFavoriteToggle?.();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    console.log('✅ Image loaded:', asset.filename);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('❌ Image failed to load:', asset.filename);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
      }}
      onClick={handleContainerClick} onTouchEnd={handleContainerClick as any}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent shrink-0 h-16">
          <h2 id="lightbox-title" className="text-lg font-medium text-white truncate">
            {asset.filename}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {/* Zoom Controls */}
            {!imageError && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={zoom <= MIN_ZOOM}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-white',
                    zoom <= MIN_ZOOM ? 'opacity-30 cursor-not-allowed' : 'hover:bg-card/10'
                  )}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomReset();
                  }}
                  disabled={zoom === MIN_ZOOM}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-white',
                    zoom === MIN_ZOOM ? 'opacity-30 cursor-not-allowed' : 'hover:bg-card/10'
                  )}
                  aria-label="Reset zoom"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={zoom >= MAX_ZOOM}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-white',
                    zoom >= MAX_ZOOM ? 'opacity-30 cursor-not-allowed' : 'hover:bg-card/10'
                  )}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>

                <div className="w-px h-6 bg-card/20 mx-1" />
              </>
            )}

            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleFavorite}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200',
                'text-white hover:bg-card/10 hover:scale-110',
                isFavorite && 'bg-card/10'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={cn(
                  'h-5 w-5 transition-all duration-200', 
                  isFavorite ? 'fill-current text-destructive scale-110' : 'scale-100'
                )} 
              />
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-card/10 transition-colors relative"
              aria-label="Copy link"
            >
              <Link2 
                className={cn(
                  'h-5 w-5 absolute inset-0 m-auto transition-opacity duration-300',
                  copySuccess ? 'opacity-0' : 'opacity-100'
                )} 
              />
              <Check 
                className={cn(
                  'h-5 w-5 absolute inset-0 m-auto transition-opacity duration-300 text-green-400',
                  copySuccess ? 'opacity-100' : 'opacity-0'
                )} 
              />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={downloading}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300",
                downloading && "opacity-50 cursor-not-allowed",
                downloadSuccess 
                  ? "text-success hover:bg-green-500/10" 
                  : "text-white hover:bg-card/10"
              )}
              aria-label="Download"
            >
              <div className="relative w-5 h-5">
                <Download 
                  className={cn(
                    "h-5 w-5 absolute inset-0 transition-all duration-300",
                    downloadSuccess ? "opacity-0 scale-0" : "opacity-100 scale-100",
                    downloading && "animate-pulse"
                  )}
                />
                <CheckCircle 
                  className={cn(
                    "h-5 w-5 absolute inset-0 transition-all duration-300",
                    downloadSuccess ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                />
              </div>
            </button>
            {/* Info Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMetadata(prev => !prev);
              }}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-white hover:bg-card/10',
                showMetadata && 'bg-card/10'
              )}
              aria-label="Toggle metadata"
            >
              <Info className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-card/20 mx-1" />

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-card/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Area */}
        <div 
          ref={imageContainerRef}
          className="flex-1 flex items-center justify-center p-16 relative min-h-0 overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            cursor: zoom > MIN_ZOOM ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            touchAction: zoom > MIN_ZOOM ? 'none' : 'auto',
          }}
        >
          {/* Navigation Arrows */}
          {hasPrevious && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrevious?.();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Loading Spinner */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
                <p className="text-white text-sm">Loading image...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {imageError && (
            <div className="flex flex-col items-center gap-4 text-white">
              <div className="h-24 w-24 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="text-6xl">⚠️</span>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Failed to load image</p>
                <p className="text-sm text-white/60 mt-1">{asset.filename}</p>
              </div>
            </div>
          )}

          {/* Actual Image */}
          {!imageError && (
            <img
              ref={imageRef}
              src={asset.path}
              alt={asset.filename}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={handleImageClick}
              onDoubleClick={handleImageDoubleClick}
              className={cn(
                'max-w-full max-h-full object-contain transition-all duration-300',
                imageLoading && 'opacity-0',
                zoom > MIN_ZOOM && 'cursor-grab active:cursor-grabbing'
              )}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transition: isDragging || initialPinchDistance !== null ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              draggable={false}
            />
          )}

          {/* Zoom Hint */}
          {!imageLoading && !imageError && zoom === MIN_ZOOM && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center">
              Click to zoom • Double-click for 3x • Ctrl+Scroll to zoom
              <br />
              <span className="text-xs">Touch: Pinch to zoom • Swipe to navigate</span>
            </div>
          )}

          {/* Zoom Level Indicator */}
          {zoom > MIN_ZOOM && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent shrink-0">
          <p className="text-sm text-white/80 text-center">
            <kbd className="px-2 py-1 rounded bg-card/10 text-xs">Esc</kbd> close • 
            <kbd className="px-2 py-1 rounded bg-card/10 text-xs">←</kbd>
            <kbd className="px-2 py-1 rounded bg-card/10 text-xs">→</kbd> navigate •
            <kbd className="px-2 py-1 rounded bg-card/10 text-xs">Z</kbd> zoom •
            <kbd className="px-2 py-1 rounded bg-card/10 text-xs">Ctrl</kbd>+<kbd className="px-2 py-1 rounded bg-card/10 text-xs">Scroll</kbd> wheel zoom
          </p>
        </div>
      </div>

      {/* Metadata Sidebar */}
      {showMetadata && (
        <div
          ref={metadataRef}
          className={cn(
            'w-80 bg-card border-l border-border flex flex-col shrink-0',
            'transition-transform duration-300 ease-in-out',
            showMetadata ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{ 
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 1,
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Photo Information</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMetadata(false);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Close metadata"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            {/* File Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">File Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Filename:</span>
                  <span className="font-medium text-right break-all">{asset.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{asset.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Favorite:</span>
                  <span className="font-medium">{isFavorite ? '❤️ Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zoom:</span>
                  <span className="font-medium">{Math.round(zoom * 100)}%</span>
                </div>
              </div>
            </div>

            {/* EXIF Data */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Camera Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Camera:</span>
                  <span className="font-medium">Canon EOS R5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens:</span>
                  <span className="font-medium">RF 24-70mm f/2.8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Focal Length:</span>
                  <span className="font-medium">50mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aperture:</span>
                  <span className="font-medium">f/2.8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shutter:</span>
                  <span className="font-medium">1/200s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ISO:</span>
                  <span className="font-medium">400</span>
                </div>
              </div>
            </div>

            {/* IPTC Data */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Copyright & Credits</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Creator:</span>
                  <p className="font-medium">Kori Photography</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Copyright:</span>
                  <p className="font-medium">© 2025 All Rights Reserved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
