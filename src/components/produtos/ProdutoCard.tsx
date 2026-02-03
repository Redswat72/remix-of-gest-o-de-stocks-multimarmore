import { MapPin, Edit, Trash2, Package, Image as ImageIcon } from 'lucide-react';
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
import type { Produto } from '@/types/database';

const FORMA_LABELS: Record<string, string> = {
  bloco: 'Bloco',
  chapa: 'Chapa',
  ladrilho: 'Ladrilho',
};

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
  const fotos = [produto.foto1_url, produto.foto2_url, produto.foto3_url, produto.foto4_url].filter(Boolean);
  const mainFoto = fotos[0];

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

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Imagem Principal */}
      <div className="relative aspect-video bg-muted">
        {mainFoto ? (
          <img
            src={mainFoto}
            alt={produto.idmm}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badge da forma */}
        <Badge className={`absolute top-2 left-2 ${FORMA_COLORS[produto.forma]}`}>
          {FORMA_LABELS[produto.forma]}
        </Badge>

        {/* Contador de fotos */}
        {fotos.length > 1 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
            <ImageIcon className="h-3 w-3" />
            {fotos.length}
          </div>
        )}

        {/* GPS indicator */}
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
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-lg">{produto.idmm}</h3>
            <p className="text-sm text-muted-foreground">{produto.tipo_pedra}</p>
          </div>
          {!produto.ativo && (
            <Badge variant="outline" className="text-destructive border-destructive">
              Inativo
            </Badge>
          )}
        </div>

        {/* Detalhes */}
        <div className="space-y-1 text-sm mb-4">
          {produto.nome_comercial && (
            <p><span className="text-muted-foreground">Nome:</span> {produto.nome_comercial}</p>
          )}
          {produto.acabamento && (
            <p><span className="text-muted-foreground">Acabamento:</span> {produto.acabamento}</p>
          )}
          {getDimensoes() && (
            <p><span className="text-muted-foreground">Dimensões:</span> {getDimensoes()}</p>
          )}
          {produto.area_m2 && (
            <p><span className="text-muted-foreground">Área:</span> {produto.area_m2.toFixed(2)} m²</p>
          )}
          {produto.volume_m3 && (
            <p><span className="text-muted-foreground">Volume:</span> {produto.volume_m3.toFixed(3)} m³</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(produto)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Produto</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem a certeza que deseja eliminar o produto <strong>{produto.idmm}</strong>?
                  Esta ação irá desativar o produto e não pode ser revertida facilmente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(produto.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
