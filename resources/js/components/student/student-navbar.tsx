import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NotificationMenu } from '@/components/notifications/notification-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { Auth, NotificationFeed } from '@/types';

const navItems = [
    {
        title: 'Beranda',
        href: '/dashboard',
    },
    {
        title: 'Jadwal',
        href: '/schedules',
    },
    {
        title: 'Program',
        href: '/enrollments',
    },
    {
        title: 'Rekaman',
        href: '/recordings',
    },
    {
        title: 'Try Out',
        href: '/try-outs',
    },
];

export function StudentNavbar() {
    const { auth, notificationFeed } = usePage<{
        auth: Auth;
        notificationFeed: NotificationFeed;
    }>().props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-full w-[54%] bg-[linear-gradient(115deg,rgba(15,143,122,0.28)_0%,rgba(43,191,163,0.16)_46%,rgba(255,255,255,0)_100%)] opacity-100 [clip-path:polygon(0_0,78%_0,95%_36%,82%_100%,0_100%)] sm:w-[42%] lg:w-[32%]"
                />
            </div>
            <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-8 lg:px-10">
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 size-10 rounded-full text-[#102a3a] hover:bg-[#edf7f4]"
                                aria-label="Buka menu"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72">
                            <SheetHeader className="text-left">
                                <SheetTitle>Menu belajar</SheetTitle>
                            </SheetHeader>
                            <nav className="mt-6 grid gap-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        className={cn(
                                            'flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#102a3a] transition-colors hover:bg-[#edf7f4] hover:text-[#0f8f7a]',
                                            isCurrentUrl(item.href) &&
                                                'bg-[#edf7f4] text-[#0f8f7a]',
                                        )}
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>

                <Link
                    href="/dashboard"
                    prefetch
                    className="relative z-10 flex shrink-0 items-center"
                >
                    <AppLogo />
                </Link>

                <nav className="ml-8 hidden h-full items-center gap-8 text-sm font-medium lg:flex">
                    {navItems.map((item) => {
                        const isActive = isCurrentUrl(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'group relative flex h-full items-center px-0.5 whitespace-nowrap text-[#102a3a]/75 transition-colors duration-300 hover:text-[#0f8f7a]',
                                    isActive && 'text-[#0f8f7a]',
                                )}
                            >
                                {item.title}
                                <span
                                    className={cn(
                                        'absolute right-0 bottom-4 left-0 mx-auto h-1 w-0 rounded-full bg-[#0f8f7a] opacity-0 transition-all duration-300 group-hover:w-8 group-hover:opacity-50',
                                        isActive && 'w-8 opacity-100',
                                    )}
                                />
                            </Link>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <NotificationMenu
                        initialFeed={notificationFeed}
                        locale="id"
                        buttonClassName="size-10 text-[#102a3a] transition-colors hover:bg-[#edf7f4] hover:text-[#0f8f7a]"
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="-mr-2 size-10 rounded-full p-1 transition-colors hover:bg-[#edf7f4]"
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={auth.user?.avatar}
                                        alt={auth.user?.name}
                                    />
                                    <AvatarFallback>
                                        {getInitials(auth.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
