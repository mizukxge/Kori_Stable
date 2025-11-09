/**
 * PDF Viewer Component
 * Displays PDF documents with page navigation and zoom controls
 */

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

// Set up PDF.js worker - configure it to use the bundled worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset page when file changes
  useEffect(() => {
    setCurrentPage(1);
    setZoom(100);
    setError(null);
  }, [filePath]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

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

  const canGoPrevious = currentPage > 1;
  const canGoNext = numPages ? currentPage < numPages : false;

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

        {/* Page Navigation */}
        {numPages && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={!canGoPrevious}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
              <input
                type="number"
                min="1"
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Math.min(Math.max(1, parseInt(e.target.value) || 1), numPages);
                  setCurrentPage(page);
                }}
                className="w-12 px-1 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs">/ {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={!canGoNext}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
            <button
              onClick={resetZoom}
              className="hover:underline cursor-pointer"
              title="Reset zoom to 100%"
            >
              {zoom}%
            </button>
          </div>

          <button
            onClick={zoomIn}
            disabled={zoom >= 200}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Download Button */}
        {showDownloadButton && (
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
            title="Download PDF"
            aria-label="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Document Container */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950" style={{ height: height }}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Please try again later</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <Document
              file={filePath}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={zoom / 100}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                className="shadow-lg"
              />
            </Document>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {!error && numPages && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          Page {currentPage} of {numPages}
        </div>
      )}
    </div>
  );
}
