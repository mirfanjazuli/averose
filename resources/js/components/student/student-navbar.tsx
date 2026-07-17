import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-5 md:px-8">
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 size-9"
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
                                            'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                            isCurrentUrl(item.href) &&
                                                'bg-muted text-foreground',
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
                    className="flex shrink-0 items-center"
                >
                    <AppLogo />
                </Link>

                <nav className="ml-8 hidden h-16 items-center gap-7 lg:flex">
                    {navItems.map((item) => {
                        const isActive = isCurrentUrl(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'relative flex h-16 items-center whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                    isActive && 'text-foreground',
                                )}
                            >
                                {item.title}
                                <span
                                    className={cn(
                                        'absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary opacity-0 transition-opacity',
                                        isActive && 'opacity-100',
                                    )}
                                />
                            </Link>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="-mr-2 size-10 rounded-full p-1"
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
