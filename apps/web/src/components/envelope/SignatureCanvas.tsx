/**
 * SignatureCanvas Component
 * HTML5 Canvas-based signature pad for drawing signatures
 */

import { useRef, useEffect, useState } from 'react';

interface SignatureCanvasProps {
  onSignatureChange?: (dataUrl: string) => void;
  placeholder?: string;
  height?: number;
  width?: number;
}

export function SignatureCanvas({
  onSignatureChange,
  placeholder = 'Draw your signature',
  height = 200,
  width = 500,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear and set up context
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.closePath();

    setIsDrawing(false);

    // Call callback with canvas data URL
    if (canvasRef.current && onSignatureChange) {
      onSignatureChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);

      if (onSignatureChange) {
        onSignatureChange('');
      }
    }
  };

  const handleUndo = () => {
    // Simple undo by clearing (in a real app, you'd maintain a history)
    handleClear();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{placeholder}</label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full cursor-crosshair"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClear}
          disabled={isEmpty}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>

        <button
          onClick={handleUndo}
          disabled={isEmpty}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo
        </button>

        <div className="flex-1" />

        {isEmpty && (
          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            Draw your signature above
          </span>
        )}
        {!isEmpty && (
          <span className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
            ✅ Signature captured
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Use your mouse or touchpad to draw your signature in the box above.
      </p>
    </div>
  );
}
