import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Download, Link2, Info, Check } from 'lucide-react';
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
  const metadataRef = useRef<HTMLDivElement>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Debug: Log favorite state changes
  useEffect(() => {
    if (asset) {
      console.log('📸 Lightbox rendered - Asset:', asset.id, 'isFavorite:', isFavorite);
    }
  }, [asset?.id, isFavorite]);

  // Reset metadata panel when asset changes
  useEffect(() => {
    setShowMetadata(false);
  }, [asset?.id]);

  // Click outside metadata to close
  useEffect(() => {
    if (!showMetadata) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (metadataRef.current && !metadataRef.current.contains(e.target as Node)) {
        // Clicked outside metadata panel
        setShowMetadata(false);
        console.log('📋 Metadata closed (click outside)');
      }
    };

    // Small delay to prevent immediate closure
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
          setShowMetadata(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, showMetadata, onClose, onNext, onPrevious, hasNext, hasPrevious]);

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

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      onClose();
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

  const handleDownload = () => {
    console.log('📥 Download initiated for:', asset.filename);
    // TODO: Implement actual download from API
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❤️ Lightbox favorite clicked - Asset:', asset.id, 'Current isFavorite prop:', isFavorite);
    onFavoriteToggle?.();
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
      onClick={handleContainerClick}
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
            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleFavorite}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200',
                'text-white hover:bg-white/10 hover:scale-110',
                isFavorite && 'bg-white/10'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={cn(
                  'h-5 w-5 transition-all duration-200', 
                  isFavorite ? 'fill-current text-red-500 scale-110' : 'scale-100'
                )} 
              />
            </button>

            {/* Copy Link Button with fade transition */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors relative"
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
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Download"
            >
              <Download className="h-5 w-5" />
            </button>

            {/* Info Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMetadata(prev => !prev);
              }}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-white hover:bg-white/10',
                showMetadata && 'bg-white/10'
              )}
              aria-label="Toggle metadata"
            >
              <Info className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center p-16 relative min-h-0">
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

          {/* Image Placeholder */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-full max-w-full"
          >
            <div 
              className="flex items-center justify-center bg-muted rounded-lg" 
              style={{ minWidth: '400px', minHeight: '400px' }}
            >
              <div className="text-center p-8">
                <div className="mx-auto mb-4 h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-6xl">📷</span>
                </div>
                <p className="text-muted-foreground font-medium">{asset.filename}</p>
                <p className="text-xs text-muted-foreground mt-2">Full image viewer coming soon</p>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  isFavorite prop: {isFavorite ? '❤️ TRUE' : '❌ FALSE'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent shrink-0">
          <p className="text-sm text-white/80 text-center">
            <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Esc</kbd> close • 
            <kbd className="px-2 py-1 rounded bg-white/10 text-xs">←</kbd>
            <kbd className="px-2 py-1 rounded bg-white/10 text-xs">→</kbd> navigate •
            <kbd className="px-2 py-1 rounded bg-white/10 text-xs">I</kbd> info •
            Click dark area / outside panel to close
          </p>
        </div>
      </div>

      {/* Metadata Sidebar with click-outside detection */}
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
        {/* Metadata Header with Close Button */}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
    </div>
  );
}