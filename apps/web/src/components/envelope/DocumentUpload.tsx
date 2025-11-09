/**
 * Document Upload Step
 * Step 2 of the wizard: Upload documents to be signed
 */

import { useRef, useState } from 'react';

interface DocumentUploadProps {
  documents: Array<{
    id: string;
    name: string;
    file: File;
  }>;
  onAddDocument: (name: string, file: File) => void;
  onRemoveDocument: (docId: string) => void;
}

export function DocumentUpload({
  documents,
  onAddDocument,
  onRemoveDocument,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF, PNG, and JPEG files are allowed';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 50MB';
    }
    if (documents.some((d) => d.file.name === file.name)) {
      return 'A file with this name already exists';
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      // Use file name without extension as default name, or allow user to customize
      const docName = file.name.replace(/\.[^/.]+$/, '');
      onAddDocument(docName, file);
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Documents</h2>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-block"
        >
          <div className="text-4xl mb-3">📤</div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            PDF, PNG, or JPEG up to 50MB
          </p>
        </button>
      </div>

      {/* Uploaded documents list */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Documents ({documents.length})
          </h3>

          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(doc.file.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {doc.file.name} • {formatFileSize(doc.file.size)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRemoveDocument(doc.id)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state message */}
      {documents.length === 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-semibold">💡 Tip:</span> Upload at least one document that signers will need to sign. You can upload PDFs or images.
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">📋 Supported formats:</p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• PDF documents (*.pdf)</li>
          <li>• Images (*.png, *.jpg, *.jpeg)</li>
          <li>• Maximum file size: 50MB per document</li>
        </ul>
      </div>
    </div>
  );
}
