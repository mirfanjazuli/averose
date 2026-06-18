import { Link } from '@inertiajs/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { dashboard, login } from '@/routes';
import BrandMark from './brand-mark';
import { consultationUrl } from './links';

const navigation = [
    { label: 'Program', href: '#program' },
    { label: 'Keunggulan', href: '#keunggulan' },
    { label: 'Kisah Sukses', href: '#kisah-sukses' },
    { label: 'Artikel', href: '#artikel' },
];

export default function Navbar({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 shadow-sm shadow-foreground/[0.02] backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">
                <a href="#home" aria-label="AveRose home">
                    <BrandMark />
                </a>

                <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
                    {navigation.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="transition-colors hover:text-primary"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href={isAuthenticated ? dashboard() : login()}
                        className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted sm:inline-flex"
                    >
                        {isAuthenticated ? 'Dashboard' : 'Masuk'}
                    </Link>
                    <a
                        href={consultationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 sm:inline-flex"
                    >
                        Konsultasi
                        <ArrowRight className="size-4" />
                    </a>
                    <button
                        type="button"
                        aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((open) => !open)}
                        className="flex size-10 items-center justify-center rounded-xl border bg-background lg:hidden"
                    >
                        {isOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="border-t bg-background px-4 py-4 shadow-xl lg:hidden">
                    <nav className="mx-auto grid max-w-7xl gap-1">
                        {navigation.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted"
                            >
                                {item.label}
                            </a>
                        ))}
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-4">
                            <Link
                                href={isAuthenticated ? dashboard() : login()}
                                className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold"
                            >
                                {isAuthenticated ? 'Dashboard' : 'Masuk'}
                            </Link>
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                            >
                                Konsultasi
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
