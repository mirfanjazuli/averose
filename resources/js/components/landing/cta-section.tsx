import { ArrowRight, MessageCircle } from 'lucide-react';
import { consultationUrl } from './links';

export default function CtaSection() {
    return (
        <section className="py-14 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#102a3a] px-5 py-10 text-white shadow-xl shadow-[#102a3a]/10 sm:rounded-[2.5rem] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#d9a441]" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#8ce0cf] uppercase">
                                <MessageCircle className="size-4" />
                                Mulai perjalananmu
                            </div>
                            <h2 className="max-w-3xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                                Impian menjadi dokter layak dipersiapkan dengan
                                cara terbaik.
                            </h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                                Ceritakan target dan tantangan belajarmu. Tim
                                AveRose akan membantu memilih program yang
                                paling sesuai.
                            </p>
                        </div>
                        <a
                            href={consultationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d9a441] px-7 py-4 text-sm font-semibold text-[#102a3a] shadow-xl shadow-[#d9a441]/20 transition hover:-translate-y-0.5 sm:w-fit"
                        >
                            Konsultasi sekarang
                            <ArrowRight className="size-4" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
