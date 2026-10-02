import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, Loader2, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured, fileToDataUrl } from '@/lib/cloudinary';
import { SquareCropperModal } from '@/components/square-cropper-modal';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudinaryReady = isCloudinaryConfigured();

  // Handle selected file from drop or file dialog
  const handleSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit.');
      return;
    }

    setErrorMessage(null);
    try {
      // Convert file to Data URL and open the square cropper modal
      const dataUrl = await fileToDataUrl(file);
      setImageToCrop(dataUrl);
    } catch (err: any) {
      console.error('File read error:', err);
      setErrorMessage('Failed to read image file.');
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleSelectedFile(file);
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = '';
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
      void handleSelectedFile(file);
    }
  };

  // Called when user completes cropping in the SquareCropperModal
  const handleCropConfirm = async (croppedBlob: Blob, croppedDataUrl: string) => {
    setImageToCrop(null);
    setIsUploading(true);
    setErrorMessage(null);

    try {
      if (cloudinaryReady) {
        // Upload the exact 1:1 square cropped image to Cloudinary in DSD_9 folder
        const secureUrl = await uploadImageToCloudinary(croppedBlob, 'DSD_9');
        onChange(secureUrl);
      } else {
        // Local preview fallback
        onChange(croppedDataUrl);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // Fallback to local cropped preview so user never loses their dish crop
      onChange(croppedDataUrl);

      const rawMsg = err?.message || '';
      if (rawMsg.toLowerCase().includes('upload preset') || rawMsg.toLowerCase().includes('preset not found')) {
        setErrorMessage(
          'Cloudinary preset not found: Please create an "Unsigned" upload preset named "qr_ordering" in Cloudinary Console (Settings > Upload > Upload presets).'
        );
      } else if (rawMsg.toLowerCase().includes('cloud_name')) {
        setErrorMessage(
          'Cloudinary Cloud Name mismatch: In .env.local, ensure VITE_CLOUDINARY_CLOUD_NAME matches your Cloudinary Dashboard.'
        );
      } else {
        setErrorMessage(`Upload note: ${rawMsg}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#485c6c]">
          <span>Dish Photo</span>
          <span className="rounded bg-[#edeae1] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#677782]">
            1:1 Square Only
          </span>
        </label>
      </div>

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* 1. STATE: Uploading Indicator */}
      {isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#ded9cc] bg-white p-7 text-center shadow-sm">
          <Loader2 size={26} className="animate-spin text-[#16806e]" />
          <p className="mt-2.5 text-[12px] font-semibold text-[#203147]">
            {cloudinaryReady ? 'Uploading square photo...' : 'Processing square photo...'}
          </p>
        </div>
      ) : value ? (
        /* 2. STATE: Image exists - High Quality Clean 1:1 Square Preview Card */
        <div className="overflow-hidden rounded-2xl border border-[#ded9cc] bg-white p-3.5 shadow-sm transition-all">
          <div className="flex items-center gap-4">
            {/* Square Aspect Ratio Preview */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#e4dfd4] bg-[#f2efe8] shadow-inner">
              <img
                src={value}
                alt="Dish preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 font-mono text-[8px] font-bold text-white">
                1:1
              </div>
            </div>

            {/* Info and Actions */}
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e7f4ef] px-2 py-0.5 font-mono text-[9px] font-bold text-[#16806e]">
                <Check size={11} /> 1:1 Square Ready
              </span>

              {/* Action Buttons: Only Change and Remove */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#ded9cc] bg-[#fbfaf6] px-3 py-1.5 text-[11px] font-semibold text-[#526372] transition-colors hover:border-[#16806e] hover:text-[#203147] cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Change
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#a84e45] hover:bg-[#faeceb] transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3. STATE: No image - Elegant Drag & Drop Square Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? 'border-[#16806e] bg-[#eef7f4]'
              : 'border-[#ded9cc] bg-white hover:border-[#16806e] hover:bg-[#faf9f5]'
          }`}
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf5f3] text-[#16806e] transition-transform duration-200 group-hover:scale-105 group-hover:shadow-sm">
            <UploadCloud size={22} />
          </div>
          <p className="mt-3 text-[13px] font-bold text-[#203147]">
            Choose dish photo
          </p>
          <p className="mt-0.5 text-[11px] text-[#71828f]">
            Strict 1:1 square only · Click or drag photo here
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-md bg-[#f0ede6] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#6a7b88]">
              PNG, JPG, WEBP up to 10MB
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 rounded-xl bg-[#faeceb] p-2.5 text-[11px] font-medium text-[#b85046]">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4. Square Image Cropper Modal */}
      {imageToCrop && (
        <SquareCropperModal
          imageSrc={imageToCrop}
          onConfirm={handleCropConfirm}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </div>
  );
}
