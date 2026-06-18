import { HeartPulse } from 'lucide-react';

export default function BrandMark() {
    return (
        <span className="flex items-center gap-2.5">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <HeartPulse className="size-5" strokeWidth={2.4} />
                <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-background bg-amber-400" />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight">
                Ave<span className="text-primary">Rose</span>
            </span>
        </span>
    );
}
