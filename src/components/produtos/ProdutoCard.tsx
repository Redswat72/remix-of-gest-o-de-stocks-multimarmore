import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Edit, Trash2, Package, Image as ImageIcon, Sparkles, ZoomIn, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FotoLightbox, createFotosList } from './FotoLightbox';
import { ProdutoQrCode } from './ProdutoQrCode';
import type { Produto } from '@/types/database';
import { useAppT } from '@/hooks/useAppT';

const FORMA_COLORS: Record<string, string> = {
  bloco: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  chapa: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ladrilho: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface ProdutoCardProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ProdutoCard({ produto, onEdit, onDelete, isDeleting }: ProdutoCardProps) {
  const navigate = useNavigate();
  const t = useAppT();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fotos = [produto.foto1_url, produto.foto2_url, produto.foto3_url, produto.foto4_url].filter(Boolean);
  const fotosHd = [produto.foto1_hd_url, produto.foto2_hd_url, produto.foto3_hd_url, produto.foto4_hd_url].filter(Boolean);
  const mainFoto = fotos[0];
  const hasHdPhotos = fotosHd.length > 0;

  const fotosList = createFotosList(produto);

  const FORMA_LABELS: Record<string, string> = {
    bloco: t('enums.tipoProduto.bloco'),
    chapa: t('enums.tipoProduto.chapa'),
    ladrilho: t('enums.tipoProduto.ladrilho'),
  };

  const getDimensoes = () => {
    if (produto.forma === 'bloco') {
      if (produto.comprimento_cm && produto.largura_cm && produto.altura_cm) {
        return `${produto.comprimento_cm} × ${produto.largura_cm} × ${produto.altura_cm} cm`;
      }
    } else {
      if (produto.comprimento_cm && produto.largura_cm) {
        const dim = `${produto.comprimento_cm} × ${produto.largura_cm}`;
        if (produto.espessura_cm) {
          return `${dim} × ${produto.espessura_cm} cm`;
        }
        return `${dim} cm`;
      }
    }
    return null;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fotosList.length > 0) {
      setLightboxIndex(0);
      setLightboxOpen(true);
    }
  };

  const handleHdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hdIndex = fotosList.findIndex(f => f.isHd);
    if (hdIndex >= 0) {
      setLightboxIndex(hdIndex);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div 
          className="relative aspect-video bg-muted cursor-pointer group"
          onClick={handleImageClick}
        >
          {mainFoto ? (
            <>
              <img
                src={mainFoto}
                alt={produto.idmm}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          <Badge className={`absolute top-2 left-2 ${FORMA_COLORS[produto.forma]}`}>
            {FORMA_LABELS[produto.forma]}
          </Badge>

          <div className="absolute top-2 right-2 flex items-center gap-1">
            {hasHdPhotos && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 bg-accent/90 hover:bg-accent text-accent-foreground"
                onClick={handleHdClick}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                HD
              </Button>
            )}
            {fotosList.length > 1 && (
              <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                <ImageIcon className="h-3 w-3" />
                {fotosList.length}
              </div>
            )}
          </div>

          {produto.latitude && produto.longitude && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-white/90 text-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                GPS
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-lg">{produto.idmm}</h3>
              <p className="text-sm text-muted-foreground">{produto.tipo_pedra}</p>
            </div>
            {!produto.ativo && (
              <Badge variant="outline" className="text-destructive border-destructive">
                {t('products.inactive')}
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm mb-4">
            {produto.nome_comercial && (
              <p><span className="text-muted-foreground">{t('products.commercialName')}:</span> {produto.nome_comercial}</p>
            )}
            {produto.acabamento && (
              <p><span className="text-muted-foreground">{t('products.finish')}:</span> {produto.acabamento}</p>
            )}
            {getDimensoes() && (
              <p>📐 {getDimensoes()}</p>
            )}
            {produto.forma === 'bloco' && produto.peso_ton != null && produto.peso_ton > 0 && (
              <p>⚖️ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(produto.peso_ton)} ton</p>
            )}
            {produto.area_m2 && (
              <p><span className="text-muted-foreground">{t('products.area')}:</span> {produto.area_m2.toFixed(2)} m²</p>
            )}
            {produto.volume_m3 && (
              <p><span className="text-muted-foreground">{t('products.volume')}:</span> {produto.volume_m3.toFixed(3)} m³</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/produto/${produto.id}`)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {t('products.viewCard')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(produto)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('actions.edit')}
            </Button>
          </div>
          
          <div className="flex gap-2 mt-2">
            <ProdutoQrCode idmm={produto.idmm} tipoPedra={produto.tipo_pedra} compact />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirm.deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('confirm.deleteDescription')} <strong>{produto.idmm}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(produto.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {t('actions.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <FotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fotos={fotosList}
        initialIndex={lightboxIndex}
        idmm={produto.idmm}
        tipoPedra={produto.tipo_pedra}
      />
    </>
  );
}
