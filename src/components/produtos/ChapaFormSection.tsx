import { useMemo } from 'react';
import { Layers, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PargaCard } from './PargaCard';
import type { UseFormReturn } from 'react-hook-form';
import type { Produto } from '@/types/database';

interface ChapaFormSectionProps {
  form: UseFormReturn<any>;
  idmm: string;
  produto?: Produto | null;
  pargaFotos: PargaFotos;
  onPargaFotosChange: (fotos: PargaFotos) => void;
}

export interface PargaFotos {
  parga1_foto1_url: string | null;
  parga1_foto2_url: string | null;
  parga2_foto1_url: string | null;
  parga2_foto2_url: string | null;
  parga3_foto1_url: string | null;
  parga3_foto2_url: string | null;
  parga4_foto1_url: string | null;
  parga4_foto2_url: string | null;
}

export function ChapaFormSection({
  form,
  idmm,
  produto,
  pargaFotos,
  onPargaFotosChange,
}: ChapaFormSectionProps) {
  // Watch para calcular total em tempo real
  const parga1Qty = form.watch('parga1_quantidade') || 0;
  const parga2Qty = form.watch('parga2_quantidade') || 0;
  const parga3Qty = form.watch('parga3_quantidade') || 0;
  const parga4Qty = form.watch('parga4_quantidade') || 0;

  const quantidadeTotalChapas = useMemo(() => {
    return (parga1Qty || 0) + (parga2Qty || 0) + (parga3Qty || 0) + (parga4Qty || 0);
  }, [parga1Qty, parga2Qty, parga3Qty, parga4Qty]);

  const updatePargaFoto = (key: keyof PargaFotos, url: string | null) => {
    onPargaFotosChange({
      ...pargaFotos,
      [key]: url,
    });
  };

  return (
    <div className="space-y-6">
      {/* Secção A - Bloco de Origem (read-only) */}
      {produto && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              Bloco de Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">ID MM</p>
                <p className="font-medium">{produto.idmm}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variedade</p>
                <p className="font-medium">{produto.tipo_pedra}</p>
              </div>
              {produto.nome_comercial && (
                <div>
                  <p className="text-xs text-muted-foreground">Nome Comercial</p>
                  <p className="font-medium">{produto.nome_comercial}</p>
                </div>
              )}
              {produto.linha && (
                <div>
                  <p className="text-xs text-muted-foreground">Linha</p>
                  <p className="font-medium">{produto.linha}</p>
                </div>
              )}
              {produto.peso_ton && (
                <div>
                  <p className="text-xs text-muted-foreground">Peso (ton)</p>
                  <p className="font-medium">{produto.peso_ton}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Secção B - Pargas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Distribuição por Pargas</h3>
          <span className="text-xs text-muted-foreground">(até 4 pargas)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PargaCard
            pargaIndex={1}
            form={form}
            idmm={idmm}
            foto1Url={pargaFotos.parga1_foto1_url}
            foto2Url={pargaFotos.parga1_foto2_url}
            onFoto1Change={(url) => updatePargaFoto('parga1_foto1_url', url)}
            onFoto2Change={(url) => updatePargaFoto('parga1_foto2_url', url)}
          />
          <PargaCard
            pargaIndex={2}
            form={form}
            idmm={idmm}
            foto1Url={pargaFotos.parga2_foto1_url}
            foto2Url={pargaFotos.parga2_foto2_url}
            onFoto1Change={(url) => updatePargaFoto('parga2_foto1_url', url)}
            onFoto2Change={(url) => updatePargaFoto('parga2_foto2_url', url)}
          />
          <PargaCard
            pargaIndex={3}
            form={form}
            idmm={idmm}
            foto1Url={pargaFotos.parga3_foto1_url}
            foto2Url={pargaFotos.parga3_foto2_url}
            onFoto1Change={(url) => updatePargaFoto('parga3_foto1_url', url)}
            onFoto2Change={(url) => updatePargaFoto('parga3_foto2_url', url)}
          />
          <PargaCard
            pargaIndex={4}
            form={form}
            idmm={idmm}
            foto1Url={pargaFotos.parga4_foto1_url}
            foto2Url={pargaFotos.parga4_foto2_url}
            onFoto1Change={(url) => updatePargaFoto('parga4_foto1_url', url)}
            onFoto2Change={(url) => updatePargaFoto('parga4_foto2_url', url)}
          />
        </div>
      </div>

      <Separator />

      {/* Secção C - Quantidade Total */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-medium">Quantidade Total de Chapas</span>
        </div>
        <span className="text-2xl font-bold text-primary">{quantidadeTotalChapas}</span>
      </div>

      {/* Aviso de validação */}
      {quantidadeTotalChapas === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ É necessário ter pelo menos 1 parga com quantidade {'>'} 0
        </p>
      )}
    </div>
  );
}
