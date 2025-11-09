/**
 * PDF Viewer Component
 * Uses browser's native PDF viewer via iframe
 * Provides download fallback if PDF cannot be displayed inline
 */

import { useState } from 'react';
import { Download, FileText, ExternalLink, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  filePath: string;
  fileName?: string;
  onDownload?: () => void;
  height?: string | number;
  showDownloadButton?: boolean;
  showFileInfo?: boolean;
}

export function PDFViewer({
  filePath,
  fileName,
  onDownload,
  height = '600px',
  showDownloadButton = false,
  showFileInfo = true,
}: PDFViewerProps) {
  const [useEmbedView, setUseEmbedView] = useState(true);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = filePath;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(filePath, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2 flex-wrap">
        {/* File Info */}
        {showFileInfo && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-medium max-w-xs truncate">
              {fileName || 'Document'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Open in New Tab Button */}
          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Open PDF in new tab"
            aria-label="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Download Button */}
          {showDownloadButton && (
            <button
              onClick={handleDownload}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document Container */}
      <div
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950"
        style={{ height: height }}
      >
        {useEmbedView ? (
          <iframe
            src={`${filePath}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0"
            title={fileName || 'PDF Document'}
            onError={() => setUseEmbedView(false)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              PDF Preview Not Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Your browser may not support inline PDF viewing. Please download the document to view it.
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
