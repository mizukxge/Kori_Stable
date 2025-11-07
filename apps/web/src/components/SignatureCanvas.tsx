import { useEffect, useRef, useState } from 'react';

interface SignatureCanvasProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function SignatureCanvas({
  onSignatureChange,
  width = 600,
  height = 200,
  className = '',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    setIsDrawing(false);
    setIsEmpty(false);

    const canvas = canvasRef.current;
    if (canvas && onSignatureChange) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);

    if (onSignatureChange) {
      onSignatureChange(null);
    }
  };

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border-2 border-input rounded-lg cursor-crosshair bg-card touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
            Sign here
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-input rounded-md hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
