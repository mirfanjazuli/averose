import { Link } from '@inertiajs/react';
import { ClipboardCheck, History } from 'lucide-react';
import type { ReactNode } from 'react';

import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

const navigationItems = [
    {
        href: '/try-outs',
        icon: ClipboardCheck,
        label: 'Try Out',
    },
    {
        href: '/try-outs/results',
        icon: History,
        label: 'Riwayat',
    },
];

export function StudentTryOutLayout({
    children,
    header,
    sidebar,
}: {
    children: ReactNode;
    header?: ReactNode;
    sidebar?: ReactNode;
}) {
    const { currentUrl, isCurrentUrl } = useCurrentUrl();

    return (
        <div className="flex h-full min-w-0 max-w-full flex-1 flex-col gap-8 py-4 text-[#102a3a] md:gap-10 md:py-6">
            {header}

            <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
                <aside className="space-y-4 md:sticky md:top-6 md:h-fit">
                    <nav
                        className="flex gap-1 border-b border-[#edf3f1] pb-2 md:flex-col md:border-b-0 md:pb-0"
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
                                        'flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-[#526b7b] transition-colors hover:bg-[#edf7f4] hover:text-[#0f8f7a] md:flex-none md:justify-start',
                                        isActive &&
                                            'bg-[#edf7f4] text-[#0f8f7a] hover:bg-[#edf7f4] hover:text-[#0f8f7a]',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {sidebar ? (
                        <div className="rounded-md bg-white p-4 shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7]">
                            {sidebar}
                        </div>
                    ) : null}
                </aside>

                <div className="min-w-0">{children}</div>
            </div>
        </div>
    );
}
