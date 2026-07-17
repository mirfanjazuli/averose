import { Link } from '@inertiajs/react';
import { ClipboardCheck, History } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

const navigationItems = [
    {
        href: '/try-outs',
        icon: ClipboardCheck,
        label: 'Try outs',
    },
    {
        href: '/try-outs/results',
        icon: History,
        label: 'History',
    },
];

export function StudentTryOutLayout({
    children,
    header,
}: {
    children: ReactNode;
    header?: ReactNode;
}) {
    const { currentUrl, isCurrentUrl } = useCurrentUrl();

    return (
        <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
            {header}

            <div className="grid gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
                <Card className="h-fit p-2 md:sticky md:top-6">
                    <nav
                        className="flex gap-1 md:flex-col"
                        aria-label="Try out"
                    >
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                item.href === '/try-outs'
                                    ? isCurrentUrl(item.href)
                                    : currentUrl.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch
                                    className={cn(
                                        'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex-none md:justify-start',
                                        isActive &&
                                            'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </Card>

                <div className="min-w-0">{children}</div>
            </div>
        </div>
    );
}
