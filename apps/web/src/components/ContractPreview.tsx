import { useState } from 'react';

interface ContractPreviewProps {
  content: string;
  title?: string;
  contractNumber?: string;
  className?: string;
  showMetadata?: boolean;
  metadata?: {
    client?: string;
    template?: string;
    status?: string;
    createdAt?: string;
    sentAt?: string;
    signedAt?: string;
  };
}

export function ContractPreview({
  content,
  title,
  contractNumber,
  className = '',
  showMetadata = true,
  metadata,
}: ContractPreviewProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className={`contract-preview ${className}`}>
      {/* Header */}
      {(title || contractNumber) && (
        <div className="mb-4 pb-4 border-b">
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          {contractNumber && (
            <p className="text-sm text-muted-foreground mt-1">Contract #{contractNumber}</p>
          )}
        </div>
      )}

      {/* Metadata */}
      {showMetadata && metadata && (
        <div className="mb-4 p-4 bg-background rounded-lg border text-sm">
          <div className="grid grid-cols-2 gap-4">
            {metadata.client && (
              <div>
                <span className="font-medium text-foreground">Client:</span>
                <span className="ml-2 text-foreground">{metadata.client}</span>
              </div>
            )}
            {metadata.template && (
              <div>
                <span className="font-medium text-foreground">Template:</span>
                <span className="ml-2 text-foreground">{metadata.template}</span>
              </div>
            )}
            {metadata.status && (
              <div>
                <span className="font-medium text-foreground">Status:</span>
                <span className="ml-2">
                  <StatusBadge status={metadata.status} />
                </span>
              </div>
            )}
            {metadata.createdAt && (
              <div>
                <span className="font-medium text-foreground">Created:</span>
                <span className="ml-2 text-foreground">
                  {new Date(metadata.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {metadata.sentAt && (
              <div>
                <span className="font-medium text-foreground">Sent:</span>
                <span className="ml-2 text-foreground">
                  {new Date(metadata.sentAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {metadata.signedAt && (
              <div>
                <span className="font-medium text-foreground">Signed:</span>
                <span className="ml-2 text-foreground">
                  {new Date(metadata.signedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            title="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground min-w-[4rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            title="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomReset}
            className="ml-2 px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Contract Content */}
      <div className="border rounded-lg bg-card shadow-sm overflow-auto max-h-[600px]">
        <div
          className="prose max-w-none p-8"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${10000 / zoom}%`,
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    DRAFT: 'bg-muted text-foreground',
    SENT: 'bg-blue-100 text-primary dark:text-primary',
    SIGNED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-yellow-100 text-yellow-800',
  };

  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.DRAFT;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
      {status}
    </span>
  );
}
