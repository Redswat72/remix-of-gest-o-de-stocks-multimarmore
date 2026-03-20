import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export function StoreProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
      <AspectRatio ratio={1}>
        <div className="w-full h-full animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </AspectRatio>
      <div className="p-6 space-y-4">
        <div>
          <div className="h-6 w-3/4 rounded animate-pulse mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 w-1/3 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="flex gap-3">
          <div className="h-7 w-24 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div className="h-7 w-20 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="flex gap-2">
          <div className="h-9 flex-1 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div className="h-9 w-10 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </Card>
  );
}
