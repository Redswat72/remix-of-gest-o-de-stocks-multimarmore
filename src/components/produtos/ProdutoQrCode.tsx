import { useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Loader2, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppT } from '@/hooks/useAppT';
import { generateProductUrl, svgToPngDataUrl, downloadQrCode, getQrCodeFilename } from '@/lib/qrCodeUtils';

interface ProdutoQrCodeProps {
  idmm: string;
  tipoPedra?: string;
  compact?: boolean;
}

export function ProdutoQrCode({ idmm, tipoPedra, compact = false }: ProdutoQrCodeProps) {
  const t = useAppT();
  const qrRef = useRef<SVGSVGElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Gerar URL estável para o produto
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const productUrl = generateProductUrl(idmm, baseUrl);

  const handleDownload = useCallback(async () => {
    if (!qrRef.current) return;

    setIsDownloading(true);
    try {
      const pngDataUrl = await svgToPngDataUrl(qrRef.current, 400, 40);
      downloadQrCode(pngDataUrl, getQrCodeFilename(idmm));
      toast({
        title: t('products.qr.downloaded'),
        description: t('products.qr.downloadedDesc', { filename: getQrCodeFilename(idmm) }),
      });
    } catch (error) {
      console.error('Erro ao descarregar QR Code:', error);
      toast({
        title: t('errors.title'),
        description: t('products.qr.downloadError'),
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [idmm, toast, t]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('products.qr.linkCopied'),
        description: t('products.qr.linkCopiedDesc'),
      });
    } catch {
      toast({
        title: t('errors.title'),
        description: t('products.qr.linkCopyError'),
        variant: 'destructive',
      });
    }
  }, [productUrl, toast, t]);

  // Versão compacta - apenas botão para abrir modal
  if (compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('products.qr.title')}
            </DialogTitle>
            <DialogDescription>
              {idmm} {tipoPedra && `• ${tipoPedra}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <QRCodeSVG
                ref={qrRef}
                value={productUrl}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            
            <p className="text-xs text-center text-muted-foreground max-w-[200px]">
              {t('products.qr.hint')}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {t('products.qr.linkCopied')}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t('products.qr.download')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Versão completa - card com QR Code
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <QRCodeSVG
            ref={qrRef}
            value={productUrl}
            size={160}
            level="M"
            includeMargin={false}
          />
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          {t('products.qr.hintShort')}
        </p>

        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopyUrl}
            title={t('products.qr.linkCopied')}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <a href={productUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDownload}
            disabled={isDownloading}
            title={t('products.qr.download')}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
