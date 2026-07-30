import { cn } from '@/lib/utils';

export default function BrandMark({
    className,
}: {
    className?: string;
}) {
    return (
        <img
            src="/images/averose-logo.png"
            alt="AveRose"
            className={cn(
                'h-auto w-32 rounded-md object-contain drop-shadow-[0_0_28px_rgba(15,143,122,0.95)]',
                className,
            )}
        />
    );
}
