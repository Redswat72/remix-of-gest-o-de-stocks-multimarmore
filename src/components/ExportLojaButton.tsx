import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseEmpresa } from '@/hooks/useSupabaseEmpresa';
import { useEmpresa } from '@/context/EmpresaContext';
import { Store, Loader2 } from 'lucide-react';

interface StoreProduct {
  internal_id: string;
  name_pt: string;
  name_en: string | null;
  name_fr: string | null;
  name_de: string | null;
  name_ar: string | null;
  obs_pt: string | null;
  obs_en: string | null;
  obs_fr: string | null;
  obs_de: string | null;
  obs_ar: string | null;
  type: string;
  status: string;
  length: number | null;
  width: number | null;
  height: number | null;
  volume: number | null;
  weight: number | null;
  price_per_unit: number | null;
  currency: string;
  images: string[];
  quantity: number;
  is_hidden: boolean;
}

export default function ExportLojaButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = useSupabaseEmpresa();
  const { empresaConfig } = useEmpresa();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all active produtos
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      if (!produtos || produtos.length === 0) {
        toast({ title: 'Sem dados', description: 'Não existem produtos ativos para exportar.', variant: 'destructive' });
        return;
      }

      // Map to Store format
      const storeProducts: StoreProduct[] = produtos.map((p) => {
        // Collect all non-null photo URLs
        const images: string[] = [
          p.foto1_url, p.foto2_url, p.foto3_url, p.foto4_url,
          p.foto1_hd_url, p.foto2_hd_url, p.foto3_hd_url, p.foto4_hd_url,
        ].filter((url): url is string => !!url);

        // Build name: "Tipo Pedra - Variedade" or just tipo_pedra
        const namePt = [p.tipo_pedra, p.variedade].filter(Boolean).join(' - ');

        // Map forma to store type
        let type = p.forma as string;
        if (!['bloco', 'chapa', 'ladrilho', 'banda', 'palete_desperdicio'].includes(type)) {
          type = 'bloco';
        }

        // Weight: convert tons to kg
        const weightKg = p.peso_ton ? Math.round(p.peso_ton * 1000) : null;

        return {
          internal_id: p.idmm,
          name_pt: namePt,
          name_en: null,
          name_fr: null,
          name_de: null,
          name_ar: null,
          obs_pt: p.observacoes || null,
          obs_en: null,
          obs_fr: null,
          obs_de: null,
          obs_ar: null,
          type,
          status: 'disponivel',
          length: p.comprimento_cm || null,
          width: p.largura_cm || null,
          height: p.altura_cm || null,
          volume: p.volume_m3 || null,
          weight: weightKg,
          price_per_unit: p.valorizacao || null,
          currency: 'EUR',
          images,
          quantity: p.quantidade_total_chapas || 1,
          is_hidden: false,
        };
      });

      // Generate JSON and download
      const json = JSON.stringify(storeProducts, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `loja_${empresaConfig?.id ?? 'empresa'}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída',
        description: `${storeProducts.length} produtos exportados para formato da loja.`,
      });
    } catch (err) {
      console.error('Erro ao exportar para loja:', err);
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao exportar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
      <span className="hidden sm:inline">Exportar Loja</span>
      <span className="sm:hidden">Loja</span>
    </Button>
  );
}
