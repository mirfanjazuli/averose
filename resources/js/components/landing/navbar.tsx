import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login } from '@/routes';
import BrandMark from './brand-mark';
import { consultationUrl } from './links';

const navigation = [
    { label: 'Program', href: '#program' },
    { label: 'Keunggulan', href: '#keunggulan' },
    { label: 'Kisah Sukses', href: '#kisah-sukses' },
    { label: 'Artikel', href: '#artikel' },
    { label: 'FAQ', href: '#faq' },
];

export default function Navbar({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeHref, setActiveHref] = useState('#home');

    useEffect(() => {
        const sections = ['#home', ...navigation.map((item) => item.href)]
            .map((href) => document.querySelector(href))
            .filter((section): section is Element => Boolean(section));

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (first, second) =>
                            second.intersectionRatio - first.intersectionRatio,
                    )[0];

                if (visibleEntry?.target.id) {
                    setActiveHref(`#${visibleEntry.target.id}`);
                }
            },
            {
                rootMargin: '-35% 0px -45% 0px',
                threshold: [0.2, 0.45, 0.7],
            },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">
                <a href="#home" aria-label="AveRose home">
                    <BrandMark />
                </a>

                <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
                    {navigation.map((item) => {
                        const isActive = activeHref === item.href;

                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`group relative px-0.5 py-2 transition-colors duration-300 ${
                                    isActive
                                        ? 'text-[#0f8f7a]'
                                        : 'text-[#102a3a]/75 hover:text-[#0f8f7a]'
                                }`}
                            >
                                {item.label}
                                <span
                                    className={`absolute right-0 -bottom-0.5 left-0 mx-auto h-1 rounded-full bg-[#0f8f7a] transition-all duration-300 ${
                                        isActive
                                            ? 'w-8 opacity-100'
                                            : 'w-0 opacity-0 group-hover:w-8 group-hover:opacity-50'
                                    }`}
                                />
                            </a>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href={isAuthenticated ? dashboard() : login()}
                        className="hidden px-3 py-2 text-sm font-semibold text-[#102a3a]/75 transition-colors hover:text-[#0f8f7a] sm:inline-flex"
                    >
                        {isAuthenticated ? 'Dashboard' : 'Masuk'}
                    </Link>
                    <a
                        href={consultationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden rounded-full bg-[#d9a441] px-4 py-2 text-sm font-semibold text-[#102a3a] transition duration-300 hover:-translate-y-0.5 hover:bg-[#c89532] sm:inline-flex"
                    >
                        Konsultasi
                    </a>
                    <button
                        type="button"
                        aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((open) => !open)}
                        className="flex size-10 items-center justify-center rounded-full text-[#102a3a] transition-colors hover:bg-[#edf7f4] lg:hidden"
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
                <div className="bg-white px-4 py-4 lg:hidden">
                    <nav className="mx-auto grid max-w-7xl gap-1">
                        {navigation.map((item) => {
                            const isActive = activeHref === item.href;

                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                                        isActive
                                            ? 'bg-[#edf7f4] text-[#0f8f7a]'
                                            : 'text-[#102a3a] hover:bg-[#edf7f4]'
                                    }`}
                                >
                                    {item.label}
                                </a>
                            );
                        })}
                        <div className="mt-3 grid grid-cols-2 gap-2 pt-4">
                            <Link
                                href={isAuthenticated ? dashboard() : login()}
                                className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-[#102a3a]"
                            >
                                {isAuthenticated ? 'Dashboard' : 'Masuk'}
                            </Link>
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-[#d9a441] px-4 py-3 text-sm font-semibold text-[#102a3a]"
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
