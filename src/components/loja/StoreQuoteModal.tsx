import { useState } from 'react';
import { Send, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StoreProduct, StoreConfig } from '@/types/store';
import { buildWhatsAppQuoteUrl } from '@/hooks/useStoreCart';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  products: StoreProduct[];
  config: StoreConfig;
  onSuccess?: () => void;
}

export function StoreQuoteModal({ open, onOpenChange, products, config, onSuccess }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) { toast.error(t('quoteModal.errorName')); return; }
    if (!email.trim() || !email.includes('@')) { toast.error(t('quoteModal.errorEmail')); return; }
    if (products.length === 0) { toast.error(t('quoteModal.errorNoProducts')); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-request', {
        body: {
          client_name: name.trim(),
          client_email: email.trim(),
          client_phone: phone.trim() || null,
          message: message.trim() || null,
          company: config.displayName,
          products: products.map(p => ({
            name: p.name,
            internal_id: p.internal_id,
            type: p.type,
            dimensoes: p.dimensoes,
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSent(true);
      toast.success(t('quoteModal.successToast'));
      onSuccess?.();
    } catch (err: any) {
      console.error('Quote request error:', err);
      toast.error(t('quoteModal.errorToast'));
    } finally {
      setSending(false);
    }
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppQuoteUrl(config.whatsapp, config.displayName, products);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setTimeout(() => {
        setName(''); setEmail(''); setPhone(''); setMessage(''); setSent(false);
      }, 300);
    }
    onOpenChange(o);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-md"
          style={{ backgroundColor: '#1E2127', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="text-center py-8 space-y-4">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(57,181,74,0.15)' }}
            >
              <CheckCircle2 className="h-8 w-8 text-[#39B54A]" />
            </div>
            <h3
              className="text-xl font-semibold text-[#F5F2ED]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('quoteModal.successTitle')}
            </h3>
            <p className="text-[#C9C3BA] text-sm max-w-xs mx-auto">
              {t('quoteModal.successMessage')}
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="mt-4"
              style={{ background: 'linear-gradient(135deg, #1E5799, #2A6BB8)', color: '#fff' }}
            >
              {t('quoteModal.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#1E2127', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl text-[#F5F2ED]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {t('quoteModal.title')}
          </DialogTitle>
          <DialogDescription className="text-[#C9C3BA]">
            {t('quoteModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div
          className="p-3 rounded-lg space-y-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[#1E5799]">
            {products.length === 1 ? t('quoteModal.selectedProduct') : t('quoteModal.selectedProducts', { count: products.length })}
          </p>
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <img
                src={p.images[0] || '/placeholder.svg'}
                alt={p.name}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm text-[#F5F2ED] truncate">{p.name}</p>
                <p className="text-xs text-[#A8ADB5] font-mono">{p.internal_id}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote-name" className="text-[#C9C3BA]">{t('quoteModal.name')} *</Label>
            <Input
              id="quote-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('quoteModal.namePlaceholder')}
              required
              maxLength={100}
              className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F2ED] placeholder:text-[#A8ADB5] focus:border-[#1E5799]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-email" className="text-[#C9C3BA]">{t('quoteModal.email')} *</Label>
            <Input
              id="quote-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('quoteModal.emailPlaceholder')}
              required
              maxLength={255}
              className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F2ED] placeholder:text-[#A8ADB5] focus:border-[#1E5799]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-phone" className="text-[#C9C3BA]">{t('quoteModal.phone')}</Label>
            <Input
              id="quote-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('quoteModal.phonePlaceholder')}
              maxLength={20}
              className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F2ED] placeholder:text-[#A8ADB5] focus:border-[#1E5799]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-message" className="text-[#C9C3BA]">{t('quoteModal.message')}</Label>
            <Textarea
              id="quote-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('quoteModal.messagePlaceholder')}
              rows={4}
              maxLength={2000}
              className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] text-[#F5F2ED] placeholder:text-[#A8ADB5] focus:border-[#1E5799] resize-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={sending}
              className="w-full gap-2 font-semibold py-5"
              style={{ background: 'linear-gradient(135deg, #F7941D, #FFA940)', color: '#1A1D21' }}
            >
              {sending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {t('quoteModal.sending')}</>
              ) : (
                <><Send className="h-5 w-5" /> {t('quoteModal.submit')}</>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
              <span className="text-xs text-[#A8ADB5]">{t('quoteModal.or')}</span>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsApp}
              className="w-full gap-2 border-[#25D366] text-[#25D366] hover:bg-[rgba(37,211,102,0.1)]"
            >
              <MessageCircle className="h-5 w-5" />
              {t('quoteModal.whatsapp')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
