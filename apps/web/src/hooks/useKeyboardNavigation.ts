import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  itemCount: number;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect: (index: number) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  currentIndex,
  onNavigate,
  onSelect,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          onNavigate(Math.min(currentIndex + 1, itemCount - 1));
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          onNavigate(Math.max(currentIndex - 1, 0));
          break;

        case 'Home':
          e.preventDefault();
          onNavigate(0);
          break;

        case 'End':
          e.preventDefault();
          onNavigate(itemCount - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(currentIndex);
          break;

        case 'Escape':
          e.preventDefault();
          break;

        default:
          break;
      }
    },
    [enabled, itemCount, currentIndex, onNavigate, onSelect]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}