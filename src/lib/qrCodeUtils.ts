/**
 * Utilitários para geração e gestão de QR Codes de produtos
 */

/**
 * Gera a URL estável para um produto baseada no IDMM
 * Esta URL é usada no QR Code e permanece constante
 */
export function generateProductUrl(idmm: string, baseUrl: string): string {
  // Normalizar IDMM para URL (remover espaços, caracteres especiais)
  const normalizedIdmm = encodeURIComponent(idmm.trim());
  return `${baseUrl}/p/${normalizedIdmm}`;
}

/**
 * Converte um elemento SVG para PNG data URL
 * Usado para gerar a imagem PNG do QR Code para download
 */
export async function svgToPngDataUrl(
  svgElement: SVGSVGElement, 
  size: number = 400, 
  padding: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Não foi possível criar contexto 2D'));
      return;
    }

    const totalSize = size + padding * 2;
    canvas.width = totalSize;
    canvas.height = totalSize;

    // Fundo branco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalSize, totalSize);

    // Converter SVG para string
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem SVG'));
    };
    img.src = url;
  });
}

/**
 * Descarrega o QR Code como imagem PNG
 */
export function downloadQrCode(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Gera o nome do ficheiro para download do QR Code
 */
export function getQrCodeFilename(idmm: string): string {
  const sanitizedIdmm = idmm.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `qrcode-${sanitizedIdmm}.png`;
}
