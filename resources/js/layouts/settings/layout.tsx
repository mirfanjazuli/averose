import { Link, usePage } from '@inertiajs/react';
import { Palette, ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth, NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage<{ auth: Auth }>().props;

    if (auth.user.role !== 'student') {
        return (
            <div className="px-4 py-6">
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav
                            className="flex flex-col space-y-1 space-x-0"
                            aria-label="Settings"
                        >
                            {sidebarNavItems.map((item, index) => (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start', {
                                        'bg-muted': isCurrentOrParentUrl(
                                            item.href,
                                        ),
                                    })}
                                >
                                    <Link href={item.href}>{item.title}</Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1 md:max-w-2xl">
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid h-full flex-1 gap-5 overflow-x-auto p-4 md:grid-cols-[14rem_minmax(0,1fr)] md:p-6">
            <Card className="h-fit gap-4 p-2 md:sticky md:top-6">
                <div className="px-3 pt-3 pb-2">
                    <h1 className="border-b pb-2 font-heading text-lg font-semibold">
                        Pengaturan
                    </h1>
                </div>
                <nav className="flex gap-1 md:flex-col" aria-label="Settings">
                    {sidebarNavItems.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex-none md:justify-start',
                                    isCurrentOrParentUrl(item.href) &&
                                        'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
                                )}
                            >
                                {Icon && <Icon className="size-4" />}
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </Card>

            <div className="min-w-0 space-y-6">
                <section className="max-w-xl space-y-12">{children}</section>
            </div>
        </div>
    );
}
