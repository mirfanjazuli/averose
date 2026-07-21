import { HeartPulse } from 'lucide-react';

export default function BrandMark() {
    return (
        <span className="flex items-center gap-2.5">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#0f8f7a] text-white shadow-sm shadow-[#0f8f7a]/20">
                <HeartPulse className="size-5" strokeWidth={2.4} />
                <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-white bg-[#d9a441]" />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight text-[#102a3a]">
                Ave<span className="text-[#0f8f7a]">Rose</span>
            </span>
        </span>
    );
}
