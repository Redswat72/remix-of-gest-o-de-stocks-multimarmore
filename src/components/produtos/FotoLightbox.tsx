import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { FormaProduto } from '@/types/database';

interface FotoItem {
  url: string;
  label: string;
  isHd: boolean;
}

interface FotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  fotos: FotoItem[];
  initialIndex?: number;
  idmm: string;
  tipoPedra: string;
}

// Labels HD por forma
const HD_LABELS: Record<FormaProduto, string[]> = {
  bloco: ['Lado A', 'Lado B', 'Lado C', 'Lado D'],
  chapa: ['Frente', 'Verso'],
  ladrilho: ['Frente', 'Verso'],
};

export function FotoLightbox({
  isOpen,
  onClose,
  fotos,
  initialIndex = 0,
  idmm,
  tipoPedra,
}: FotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentFoto = fotos[currentIndex];

  // Reset ao mudar de foto ou abrir
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex, isOpen]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Navegação com teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, fotos.length]);

  const goToNext = () => {
    if (fotos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % fotos.length);
    }
  };

  const goToPrevious = () => {
    if (fotos.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom com scroll do rato
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom((prev) => {
      const newZoom = Math.max(1, Math.min(5, prev + delta));
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Arrastar imagem quando com zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limitar movimento baseado no zoom
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image) {
        const containerRect = container.getBoundingClientRect();
        const imageWidth = image.naturalWidth * zoom;
        const imageHeight = image.naturalHeight * zoom;
        
        const maxX = Math.max(0, (imageWidth - containerRect.width) / 2);
        const maxY = Math.max(0, (imageHeight - containerRect.height) / 2);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events para mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double tap/click para zoom rápido
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom === 1) {
      setZoom(2.5);
    } else {
      handleResetZoom();
    }
  }, [zoom]);

  if (!currentFoto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm border-none"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Visualização de foto - {idmm}</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-lg">{idmm}</h3>
              <p className="text-sm text-muted-foreground">{tipoPedra}</p>
            </div>
            {currentFoto.isHd && (
              <Badge className="bg-accent text-accent-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                HD
              </Badge>
            )}
            <Badge variant="outline">{currentFoto.label}</Badge>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Controlos de zoom */}
        <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="h-10 w-10"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="h-10 w-10"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetZoom}
            disabled={zoom === 1}
            className="h-10 w-10"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Indicador de zoom */}
        {zoom > 1 && (
          <div className="absolute top-20 left-4 z-20 flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full text-sm">
            <Move className="h-4 w-4" />
            {Math.round(zoom * 100)}%
          </div>
        )}

        {/* Área da imagem */}
        <div
          ref={containerRef}
          className={cn(
            "absolute inset-0 flex items-center justify-center overflow-hidden",
            zoom > 1 ? "cursor-grab" : "cursor-zoom-in",
            isDragging && "cursor-grabbing"
          )}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            ref={imageRef}
            src={currentFoto.url}
            alt={`${idmm} - ${currentFoto.label}`}
            className="max-w-full max-h-full object-contain transition-transform duration-150"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            draggable={false}
          />
        </div>

        {/* Navegação */}
        {fotos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnails */}
        {fotos.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-background/80 to-transparent">
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {fotos.map((foto, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    index === currentIndex
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={foto.url}
                    alt={foto.label}
                    className="w-full h-full object-cover"
                  />
                  {foto.isHd && (
                    <div className="absolute top-0.5 right-0.5">
                      <Sparkles className="w-3 h-3 text-accent" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {currentIndex + 1} / {fotos.length} • {currentFoto.label}
              {currentFoto.isHd && ' (HD)'}
            </p>
          </div>
        )}

        {/* Dicas de uso */}
        <div className="absolute bottom-4 right-4 z-10 text-xs text-muted-foreground/50 hidden md:block">
          Scroll para zoom • Duplo-clique para zoom rápido • Arrastar para mover
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Função utilitária para criar lista de fotos
export function createFotosList(
  produto: {
    foto1_url?: string | null;
    foto2_url?: string | null;
    foto3_url?: string | null;
    foto4_url?: string | null;
    foto1_hd_url?: string | null;
    foto2_hd_url?: string | null;
    foto3_hd_url?: string | null;
    foto4_hd_url?: string | null;
    forma: FormaProduto;
  }
): FotoItem[] {
  const fotos: FotoItem[] = [];
  const hdLabels = HD_LABELS[produto.forma];
  
  // Adicionar fotos operacionais
  const operacionais = [
    produto.foto1_url,
    produto.foto2_url,
    produto.foto3_url,
    produto.foto4_url,
  ];
  
  operacionais.forEach((url, i) => {
    if (url) {
      fotos.push({
        url,
        label: `Foto ${i + 1}`,
        isHd: false,
      });
    }
  });
  
  // Adicionar fotos HD
  const hd = [
    produto.foto1_hd_url,
    produto.foto2_hd_url,
    produto.foto3_hd_url,
    produto.foto4_hd_url,
  ];
  
  hd.forEach((url, i) => {
    if (url && i < hdLabels.length) {
      fotos.push({
        url,
        label: hdLabels[i],
        isHd: true,
      });
    }
  });
  
  return fotos;
}
