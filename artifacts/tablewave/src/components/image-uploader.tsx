import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured, fileToDataUrl } from '@/lib/cloudinary';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  presets?: { label: string; url: string }[];
}

export function ImageUploader({ value, onChange, presets = [] }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudinaryReady = isCloudinaryConfigured();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Check size (e.g. max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size should be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      if (cloudinaryReady) {
        // Upload to Cloudinary
        const secureUrl = await uploadImageToCloudinary(file);
        onChange(secureUrl);
      } else {
        // Local preview fallback (Data URL) so user can test before configuring credentials
        const dataUrl = await fileToDataUrl(file);
        onChange(dataUrl);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMessage(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-[#485c6c]">
          Dish Photo
        </label>
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-[#e7eee8] text-[#16806e] font-semibold'
                : 'text-[#7d8b94] hover:text-[#203147]'
            }`}
          >
            Upload File
          </button>
          <span className="text-[#ccc8bc]">|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
              mode === 'url'
                ? 'bg-[#e7eee8] text-[#16806e] font-semibold'
                : 'text-[#7d8b94] hover:text-[#203147]'
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Preview if image exists */}
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[#ded9cc] bg-white p-2.5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f0ede6] border border-[#e4e0d5]">
              <img
                src={value}
                alt="Dish preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-[#e8f4ef] px-2 py-0.5 font-mono text-[9px] font-bold text-[#16806e]">
                  <Check size={11} /> Photo ready
                </span>
                {value.includes('cloudinary.com') && (
                  <span className="rounded bg-[#e8f0fe] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#1967d2]">
                    Cloudinary CDN
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-[#71828f]">
                {value.startsWith('data:') ? 'Local image uploaded' : value}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16806e] hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} className={isUploading ? 'animate-spin' : ''} />
                  Replace image
                </button>
                <span className="text-[#d8d3c5]">·</span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a84e45] hover:underline cursor-pointer"
                >
                  <X size={12} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Drag & Drop Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
            isDragging
              ? 'border-[#16806e] bg-[#edf6f3]'
              : 'border-[#ded9cc] bg-white hover:border-[#16806e] hover:bg-[#faf9f5]'
          }`}
        >
          {isUploading ? (
            <div className="py-2 text-center">
              <Loader2 size={24} className="mx-auto animate-spin text-[#16806e]" />
              <p className="mt-2 text-[12px] font-semibold text-[#203147]">
                {cloudinaryReady ? 'Uploading to Cloudinary...' : 'Processing image...'}
              </p>
              <p className="text-[10px] text-[#8595a0]">Please wait a moment</p>
            </div>
          ) : (
            <>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5f3] text-[#16806e] transition-transform group-hover:scale-105">
                <UploadCloud size={20} />
              </div>
              <p className="mt-2.5 text-[12px] font-semibold text-[#203147]">
                Click or drag & drop image to upload
              </p>
              <p className="mt-0.5 text-[10px] text-[#86959f]">
                PNG, JPG, WEBP, or GIF up to 10MB
              </p>
              {!cloudinaryReady && (
                <span className="mt-2 inline-flex items-center gap-1 rounded bg-[#fdf2e9] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#b85a1c]">
                  Configure Cloudinary in .env.local for CDN hosting
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        /* Direct URL paste mode */
        <div className="relative">
          <input
            className="field"
            type="url"
            name="imageUrl"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            data-testid="input-item-image"
          />
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-lg bg-[#faeceb] p-2 text-[11px] font-medium text-[#b85046]">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset options */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-[10px] font-semibold text-[#7d8b94]">Presets:</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.url)}
              className="rounded-md border border-[#e2ded5] bg-[#fbfaf6] px-2 py-1 text-[10px] font-semibold text-[#546672] transition-colors hover:border-[#16806e] hover:text-[#16806e] cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
