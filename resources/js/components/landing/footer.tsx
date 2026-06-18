import { Instagram, MessageCircle } from 'lucide-react';
import BrandMark from './brand-mark';
import { consultationUrl, instagramUrl } from './links';

export default function Footer() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-10">
                <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <BrandMark />
                        <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                            Bimbel privat spesialis masuk Fakultas Kedokteran
                            untuk membantu siswa belajar lebih personal,
                            terarah, dan percaya diri.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Jelajahi</h3>
                        <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                            <a href="#program" className="hover:text-primary">
                                Program
                            </a>
                            <a
                                href="#keunggulan"
                                className="hover:text-primary"
                            >
                                Keunggulan
                            </a>
                            <a
                                href="#kisah-sukses"
                                className="hover:text-primary"
                            >
                                Kisah sukses
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Terhubung</h3>
                        <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 hover:text-primary"
                            >
                                <Instagram className="size-4" />
                                @averosebimbel
                            </a>
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 hover:text-primary"
                            >
                                <MessageCircle className="size-4" />
                                DM Instagram
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 AveRose. All rights reserved.</p>
                    <p>Nurture Your Future.</p>
                </div>
            </div>
        </footer>
    );
}
