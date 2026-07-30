import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard, login } from '@/routes';
import BrandMark from './brand-mark';
import { consultationUrl } from './links';

const navigation = [
    { label: 'Program', href: '/programs' },
];

const programCategories = [
    {
        label: 'Road to Campus',
        description: 'Persiapan masuk kampus dan jalur seleksi.',
        href: '/programs',
    },
    {
        label: 'Olympiad Center',
        description: 'Persiapan olimpiade dan kompetisi akademik.',
        href: '/programs',
    },
    {
        label: 'Academic Booster',
        description: 'Pendampingan pelajaran sekolah dan peningkatan nilai.',
        href: '/programs',
    },
    {
        label: 'Medical Academy',
        description: 'Program khusus mahasiswa FK dan FKG.',
        href: '/programs',
    },
];

export default function Navbar({
    isAuthenticated,
}: {
    isAuthenticated: boolean;
}) {
    const { url } = usePage();
    const [isOpen, setIsOpen] = useState(false);
    const [activeHref, setActiveHref] = useState('#home');

    useEffect(() => {
        const sections = [
            '#home',
            ...navigation
                .map((item) => item.href)
                .filter((href) => href.startsWith('#')),
        ]
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
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 h-full w-[50%] bg-[linear-gradient(115deg,rgba(15,143,122,0.36)_0%,rgba(43,191,163,0.22)_46%,rgba(255,255,255,0)_100%)] opacity-100 [clip-path:polygon(0_0,78%_0,95%_36%,82%_100%,0_100%)] sm:w-[40%] lg:w-[34%]"
                />
            </div>
            <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">
                <a
                    href="/"
                    aria-label="AveRose home"
                    className="relative z-10 inline-flex h-full items-center"
                >
                    <BrandMark className="h-16 sm:h-20" />
                </a>

                <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
                    {navigation.map((item) => {
                        const isActive =
                            item.href === '/programs'
                                ? url.startsWith('/programs')
                                : activeHref === item.href;

                        return (
                            <div
                                key={item.href}
                                className="group relative"
                            >
                                <a
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-0.5 py-2 transition-colors duration-300 ${
                                        isActive
                                            ? 'text-[#0f8f7a]'
                                            : 'text-[#102a3a]/75 hover:text-[#0f8f7a]'
                                    }`}
                                >
                                    {item.label}
                                    <ChevronDown className="size-4 transition-transform duration-300 group-hover:rotate-180" />
                                </a>
                                <span
                                    className={`absolute right-0 -bottom-0.5 left-0 mx-auto h-1 rounded-full bg-[#0f8f7a] transition-all duration-300 ${
                                        isActive
                                            ? 'w-8 opacity-100'
                                            : 'w-0 opacity-0 group-hover:w-8 group-hover:opacity-50'
                                    }`}
                                />
                                <div className="invisible absolute top-full left-1/2 w-[520px] -translate-x-1/2 pt-5 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100">
                                    <div className="overflow-hidden rounded-[1.5rem] border border-[#dcece7] bg-white p-3 shadow-2xl shadow-[#102a3a]/12">
                                        <div className="grid grid-cols-2 gap-2">
                                            {programCategories.map(
                                                (category) => (
                                                    <a
                                                        key={category.label}
                                                        href={category.href}
                                                        className="rounded-[1.15rem] p-4 transition hover:bg-[#f8fbfa]"
                                                    >
                                                        <span className="block text-sm font-semibold text-[#102a3a]">
                                                            {category.label}
                                                        </span>
                                                        <span className="mt-2 block text-xs leading-5 text-[#526b7b]">
                                                            {
                                                                category.description
                                                            }
                                                        </span>
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                        className="hidden items-center gap-2 rounded-full bg-[#d9a441] px-4 py-2 text-sm font-semibold text-[#102a3a] transition duration-300 hover:-translate-y-0.5 hover:bg-[#c89532] sm:inline-flex"
                    >
                        Konsultasi
                        <ArrowRight className="size-4" />
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
                            const isActive =
                                item.href === '/programs'
                                    ? url.startsWith('/programs')
                                    : activeHref === item.href;

                            return (
                                <div key={item.href}>
                                    <a
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                                            isActive
                                                ? 'bg-[#edf7f4] text-[#0f8f7a]'
                                                : 'text-[#102a3a] hover:bg-[#edf7f4]'
                                        }`}
                                    >
                                        {item.label}
                                        <ArrowRight className="size-4" />
                                    </a>
                                    <div className="mt-2 grid gap-1 pl-3">
                                        {programCategories.map((category) => (
                                            <a
                                                key={category.label}
                                                href={category.href}
                                                onClick={() => setIsOpen(false)}
                                                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#526b7b] transition hover:bg-[#edf7f4] hover:text-[#0f8f7a]"
                                            >
                                                {category.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
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
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9a441] px-4 py-3 text-sm font-semibold text-[#102a3a]"
                            >
                                Konsultasi
                                <ArrowRight className="size-4" />
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
