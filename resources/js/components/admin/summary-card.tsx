import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type SummaryCardProps = {
    children?: ReactNode;
    icon: LucideIcon;
    label: string;
    value: ReactNode;
};

export function SummaryCard({
    children,
    icon: Icon,
    label,
    value,
}: SummaryCardProps) {
    return (
        <Card>
            <CardContent className="relative flex min-h-36 flex-col justify-between px-6">
                <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                        {label}
                    </p>
                    <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <Icon className="size-3.5" />
                    </div>
                </div>

                <div>
                    <p className="text-5xl font-semibold tracking-normal">
                        {value}
                    </p>
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}
