import { Sparkles } from 'lucide-react';

type Props = {
    eyebrow: string;
    title: string;
    description?: string;
    centered?: boolean;
};

export default function SectionHeading({
    eyebrow,
    title,
    description,
    centered = false,
}: Props) {
    return (
        <div
            className={
                centered
                    ? 'mx-auto max-w-2xl text-center'
                    : 'max-w-xl text-left'
            }
        >
            <div
                className={`mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase ${centered ? 'justify-center' : ''}`}
            >
                <Sparkles className="size-4" />
                {eyebrow}
            </div>
            <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
                {title}
            </h2>
            {description && (
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}
