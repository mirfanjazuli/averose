import logo256 from '@/../images/brand/averose-logo-256.webp';
import logoFallback from '@/../images/brand/averose-logo-512.png';
import logo512 from '@/../images/brand/averose-logo-512.webp';
import { cn } from '@/lib/utils';

export default function BrandMark({ className }: { className?: string }) {
    return (
        <picture>
            <source
                type="image/webp"
                srcSet={`${logo256} 256w, ${logo512} 512w`}
                sizes="(min-width: 640px) 234px, 187px"
            />
            <img
                src={logoFallback}
                alt="AveRose"
                width={512}
                height={175}
                className={cn(
                    'h-auto w-32 rounded-md object-contain drop-shadow-[0_0_28px_rgba(15,143,122,0.95)]',
                    className,
                )}
            />
        </picture>
    );
}
