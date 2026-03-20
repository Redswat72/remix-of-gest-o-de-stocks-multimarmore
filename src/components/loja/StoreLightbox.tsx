import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  productName: string;
}

export function StoreLightbox({ images, currentIndex, isOpen, onClose, onIndexChange, productName }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) { setZoom(1); setPos({ x: 0, y: 0 }); }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onIndexChange((currentIndex - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight') onIndexChange((currentIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

  const resetZoom = useCallback(() => { setZoom(1); setPos({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => {
      const next = Math.max(1, Math.min(5, prev + (e.deltaY > 0 ? -0.5 : 0.5)));
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) { setDragging(true); setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); }
  }, [zoom, pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging && zoom > 1) {
      const max = (zoom - 1) * 200;
      setPos({
        x: Math.max(-max, Math.min(max, e.clientX - dragStart.x)),
        y: Math.max(-max, Math.min(max, e.clientY - dragStart.y)),
      });
    }
  }, [dragging, zoom, dragStart]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom === 1) { setZoom(2.5); } else { resetZoom(); }
  }, [zoom, resetZoom]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#0A0908]/98 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-[rgba(0,0,0,0.6)] to-transparent">
        <div className="flex items-center gap-3">
          {images.length > 1 && (
            <span className="text-sm font-mono text-[#C9C3BA] bg-[rgba(0,0,0,0.4)] px-3 py-1.5 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <span className="text-[#F5F2ED] font-medium truncate max-w-[200px] md:max-w-none">{productName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-[rgba(0,0,0,0.4)] rounded-full p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full"
              onClick={e => { e.stopPropagation(); setZoom(z => Math.max(1, z - 0.5)); }} disabled={zoom <= 1}
            ><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-xs font-mono text-[#C9C3BA] min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full"
              onClick={e => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.5)); }} disabled={zoom >= 5}
            ><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full"
              onClick={e => { e.stopPropagation(); resetZoom(); }} disabled={zoom === 1}
            ><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden"
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}
        onClick={e => e.stopPropagation()}
        style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        {images.length > 1 && (
          <>
            <Button variant="ghost" size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full bg-[rgba(0,0,0,0.3)]"
              onClick={e => { e.stopPropagation(); resetZoom(); onIndexChange((currentIndex - 1 + images.length) % images.length); }}
            ><ChevronLeft className="h-8 w-8" /></Button>
            <Button variant="ghost" size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 text-[#C9C3BA] hover:text-[#F5F2ED] rounded-full bg-[rgba(0,0,0,0.3)]"
              onClick={e => { e.stopPropagation(); resetZoom(); onIndexChange((currentIndex + 1) % images.length); }}
            ><ChevronRight className="h-8 w-8" /></Button>
          </>
        )}
        <img src={images[currentIndex]} alt={`${productName} - ${currentIndex + 1}`}
          className="max-w-[90vw] max-h-[80vh] object-contain select-none transition-transform duration-150"
          style={{ transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)` }}
          onDoubleClick={handleDoubleClick} draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="p-4 bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto max-w-full pb-2">
            {images.map((img, idx) => (
              <button key={idx}
                onClick={e => { e.stopPropagation(); resetZoom(); onIndexChange(idx); }}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-[#1E5799] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
