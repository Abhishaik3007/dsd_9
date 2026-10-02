import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared';

interface SquareCropperModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function SquareCropperModal({ imageSrc, onConfirm, onCancel }: SquareCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load natural size
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      // Reset transform
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle Dragging
  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch Support
  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Perform Final 1:1 Square Crop via HTML5 Canvas
  const handleCrop = async () => {
    if (!imageRef.current || imgNaturalSize.width === 0) return;
    setIsProcessing(true);

    try {
      const cropSize = 800; // Output crisp 800x800 square
      const canvas = document.createElement('canvas');
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }

      const container = containerRef.current;
      const viewportSize = container ? container.clientWidth : 320;

      // Base scale of image fitting the square viewport
      const isRotatedSideways = rotation === 90 || rotation === 270;
      const effectiveW = isRotatedSideways ? imgNaturalSize.height : imgNaturalSize.width;
      const effectiveH = isRotatedSideways ? imgNaturalSize.width : imgNaturalSize.height;

      // Fit mode: cover the square
      const baseScale = Math.max(viewportSize / effectiveW, viewportSize / effectiveH);
      const totalScale = baseScale * zoom;

      // Canvas transform
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cropSize, cropSize);

      ctx.save();
      // Move origin to canvas center
      ctx.translate(cropSize / 2, cropSize / 2);

      // Apply offset ratio
      const ratio = cropSize / viewportSize;
      ctx.translate(offset.x * ratio, offset.y * ratio);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image centered
      const drawW = imgNaturalSize.width * totalScale * ratio;
      const drawH = imgNaturalSize.height * totalScale * ratio;
      ctx.drawImage(imageRef.current, -drawW / 2, -drawH / 2, drawW, drawH);

      ctx.restore();

      // Export Blob & DataURL
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onConfirm(blob, croppedDataUrl);
          } else {
            onCancel();
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Crop failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#152336]/60 p-4 backdrop-blur-sm">
      <div className="surface w-full max-w-[440px] overflow-hidden rounded-[24px] border border-[#e3dfd3] bg-[#fcfbf7] p-6 shadow-[0_24px_70px_rgba(20,33,48,.25)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf5f3] text-[#16806e]">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="font-display text-[17px] font-bold text-[#203147]">
                Crop to 1:1 Square
              </h3>
              <p className="text-[11px] text-[#75848f]">
                Drag to frame your dish · Square format required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-7 w-7 place-items-center rounded-lg text-[#8899a6] hover:bg-[#edeae1] hover:text-[#203147] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewport Frame */}
        <div className="mt-5 flex justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative h-[290px] w-[290px] overflow-hidden rounded-2xl border-2 border-[#16806e] bg-[#1a2634] shadow-inner select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* The Image */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="To crop"
                crossOrigin="anonymous"
                className="max-w-none pointer-events-none select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Rule of Thirds Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Corner Crop Guide Indicators */}
            <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-white" />
            <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-white" />
            <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-l-2 border-b-2 border-white" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-r-2 border-b-2 border-white" />

            {/* Drag helper pill */}
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm flex items-center gap-1">
              <Move size={10} /> Drag to adjust
            </div>
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="mt-4 space-y-3 rounded-xl border border-[#ede9df] bg-[#f7f5ed] p-3">
          <div className="flex items-center gap-3">
            <ZoomOut size={15} className="shrink-0 text-[#7d8b94]" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dcd7cb] accent-[#16806e]"
            />
            <ZoomIn size={15} className="shrink-0 text-[#7d8b94]" />
            <span className="w-10 text-right font-mono text-[10px] font-semibold text-[#526470]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-[#ede9df] pt-2 text-[11px]">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-[#546672] hover:bg-[#eae6db] hover:text-[#203147] transition-colors"
            >
              <RotateCw size={13} />
              Rotate 90°
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="text-[10px] font-semibold text-[#7e8d97] hover:underline"
            >
              Reset framing
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#ede9df] pt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isProcessing} className="gap-1.5 shadow-sm">
            <Check size={14} />
            {isProcessing ? 'Cropping...' : 'Apply Square Crop'}
          </Button>
        </div>
      </div>
    </div>
  );
}
