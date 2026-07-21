import { Instagram, MessageCircle } from 'lucide-react';
import BrandMark from './brand-mark';
import { consultationUrl, instagramUrl } from './links';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-[#f8fbfa] to-white">
            <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 lg:px-10">
                <div className="rounded-[2rem] bg-white/72 px-5 py-8 sm:rounded-[2.5rem] sm:px-8 sm:py-10">
                    <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.8fr]">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <BrandMark />
                            <p className="mt-5 max-w-md text-sm leading-6 text-[#526b7b]">
                                Bimbingan privat untuk siswa yang serius
                                mempersiapkan Fakultas Kedokteran, olimpiade
                                sains, dan perjalanan akademik kedokteran.
                            </p>
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-6 inline-flex rounded-full bg-[#102a3a] px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f8f7a]"
                            >
                                Konsultasi Program
                            </a>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#102a3a]">
                                Jelajahi
                            </h3>
                            <div className="mt-4 grid gap-3 text-sm text-[#526b7b]">
                                {[
                                    ['Masalah', '#masalah'],
                                    ['Program', '#program'],
                                    ['Keunggulan', '#keunggulan'],
                                    ['Kisah sukses', '#kisah-sukses'],
                                ].map(([label, href]) => (
                                    <a
                                        key={href}
                                        href={href}
                                        className="w-fit transition-colors hover:text-[#0f8f7a]"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#102a3a]">
                                Terhubung
                            </h3>
                            <div className="mt-4 grid gap-3 text-sm text-[#526b7b]">
                                <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex w-fit items-center gap-2 transition-colors hover:text-[#0f8f7a]"
                                >
                                    <Instagram className="size-4" />
                                    @averosebimbel
                                </a>
                                <a
                                    href={consultationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex w-fit items-center gap-2 transition-colors hover:text-[#0f8f7a]"
                                >
                                    <MessageCircle className="size-4" />
                                    DM Instagram
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 flex flex-col gap-3 pt-6 text-xs text-[#647987] sm:flex-row sm:items-center sm:justify-between">
                        <p>© 2026 AveRose. All rights reserved.</p>
                        <p>Nurture Your Future.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
