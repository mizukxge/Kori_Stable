import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface LightboxProps {
  isOpen: boolean;
  asset: {
    id: string;
    filename: string;
    path: string;
    thumbnailPath?: string;
    mimeType: string;
  } | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function Lightbox({
  isOpen,
  asset,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🔑 Lightbox key pressed:', e.key);
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          console.log('❌ Closing lightbox (Esc)');
          onClose();
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          if (hasNext && onNext) {
            console.log('➡️ Next photo');
            onNext();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          if (hasPrevious && onPrevious) {
            console.log('⬅️ Previous photo');
            onPrevious();
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          // Block up/down arrows completely
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Up/Down arrows blocked in lightbox');
          break;
        default:
          break;
      }
    };

    // Use capture phase to intercept BEFORE other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, onNext, onPrevious, hasNext, hasPrevious]);

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

  if (!isOpen || !asset) return null;

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close if clicking the container itself (dark area)
    if (e.target === containerRef.current) {
      console.log('❌ Closing lightbox (backdrop click)');
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col"
      onClick={handleContainerClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent shrink-0">
        <h2 id="lightbox-title" className="text-lg font-medium text-white">
          {asset.filename}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Main Content Area - clicking here closes */}
      <div className="flex-1 flex items-center justify-center p-16 relative">
        {/* Navigation Arrows */}
        {hasPrevious && (
          <button
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

        {/* Image - clicking this does NOT close */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-full max-w-full"
        >
          <div 
            className="flex items-center justify-center bg-muted rounded-lg" 
            style={{ minWidth: '400px', minHeight: '400px' }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-6xl">📷</span>
              </div>
              <p className="text-muted-foreground">{asset.filename}</p>
              <p className="text-xs text-muted-foreground mt-2">Full image viewer coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent shrink-0">
        <p className="text-sm text-white/80 text-center">
          Press <kbd className="px-2 py-1 rounded bg-white/10">Esc</kbd> to close • 
          Use <kbd className="px-2 py-1 rounded bg-white/10">←</kbd> <kbd className="px-2 py-1 rounded bg-white/10">→</kbd> to navigate •
          Click dark area to close
        </p>
      </div>
    </div>
  );
}