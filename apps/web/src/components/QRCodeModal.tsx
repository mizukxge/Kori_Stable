import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

export function QRCodeModal({ isOpen, onClose, url, title, description }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        errorCorrectionLevel: 'H',
        type: 'image/jpeg',
        quality: 0.95,
        margin: 1,
        width: 300,
      }).catch((err) => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [isOpen, url]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.href = canvasRef.current.toDataURL('image/png');
      link.download = `${title.replace(/\s+/g, '-')}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-muted-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>

        {/* QR Code */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg border-4 border-border bg-card p-4">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* URL Display */}
        <div className="mb-6 rounded-lg bg-background p-3 text-center">
          <p className="break-all text-xs text-muted-foreground">{url}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleCopyLink}
            className="w-full"
            variant={copied ? 'secondary' : 'default'}
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button onClick={handleDownload} variant="secondary" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
