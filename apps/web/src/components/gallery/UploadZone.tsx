import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { uploadAsset, addAssetsToGallery } from '../../lib/api';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadZoneProps {
  galleryId: string;
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export function UploadZone({
  galleryId,
  onUploadComplete,
  maxFileSize = 50,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
}: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // File validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`,
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File too large. Max size: ${maxFileSize}MB`,
      };
    }

    return { valid: true };
  };

  // Create preview for image files
  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const newFiles: UploadFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const validation = validateFile(file);

        const preview = await createPreview(file);

        newFiles.push({
          id: `${Date.now()}-${i}`,
          file,
          preview,
          status: validation.valid ? 'pending' : 'error',
          progress: 0,
          error: validation.error,
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
      console.log(`📁 Added ${newFiles.length} files to upload queue`);
    },
    [acceptedTypes, maxFileSize]
  );

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  };

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove file from queue
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    console.log(`🗑️ Removed file from queue: ${id}`);
  };

  // Real upload to API
  const uploadFileToAPI = async (uploadFile: UploadFile): Promise<string | null> => {
    try {
      // Update to uploading status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      // Simulate progress (actual progress tracking requires chunked upload)
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === uploadFile.id && f.progress < 90) {
              return { ...f, progress: Math.min(f.progress + Math.random() * 20, 90) };
            }
            return f;
          })
        );
      }, 200);

      // Upload to API
      const response = await uploadAsset(uploadFile.file);

      clearInterval(progressInterval);

      // Update to success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, progress: 100, status: 'success' }
            : f
        )
      );

      console.log(`✅ Uploaded: ${response.data.filename} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error(`❌ Upload failed: ${uploadFile.file.name}`, error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
      return null;
    }
  };

  // Start upload
  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    console.log(`🚀 Starting upload of ${pendingFiles.length} files to gallery ${galleryId}`);

    // Upload files to API
    const uploadedAssetIds: string[] = [];
    for (const file of pendingFiles) {
      const assetId = await uploadFileToAPI(file);
      if (assetId) {
        uploadedAssetIds.push(assetId);
      }
    }

    // Add assets to gallery if any succeeded
    if (uploadedAssetIds.length > 0 && galleryId) {
      try {
        await addAssetsToGallery(galleryId, uploadedAssetIds);
        console.log(`✅ Added ${uploadedAssetIds.length} assets to gallery ${galleryId}`);
      } catch (error) {
        console.error('❌ Failed to add assets to gallery:', error);
      }
    }

    // Call completion callback
    const uploadedFiles = files.filter((f) => f.status === 'success');
    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
    }
  };

  // Clear all files
  const clearAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('🧹 Cleared all files');
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted/50 hover:bg-muted'
        )}
      >
        <Upload className={cn(
          'w-12 h-12 mx-auto mb-4 transition-colors',
          isDragging ? 'text-primary' : 'text-muted-foreground'
        )} />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isDragging ? 'Drop files here' : 'Upload Photos'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your photos here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Accepted: JPG, PNG, WEBP, HEIC · Max size: {maxFileSize}MB per file
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
              {successCount > 0 && ` · ${successCount} uploaded`}
              {errorCount > 0 && ` · ${errorCount} failed`}
            </div>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Button onClick={handleUpload} size="sm">
                  Upload {pendingCount} {pendingCount === 1 ? 'File' : 'Files'}
                </Button>
              )}
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear All
              </Button>
            </div>
          </div>

          {/* File Items */}
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <File className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {file.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.error && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {file.status === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}