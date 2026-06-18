import { ArrowRight, MessageCircle } from 'lucide-react';
import { consultationUrl } from './links';

export default function CtaSection() {
    return (
        <section className="py-14 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-5 py-10 text-background sm:rounded-[2.5rem] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                    <div className="absolute top-0 right-0 size-64 translate-x-1/3 -translate-y-1/3 rounded-full border-[48px] border-primary/20 sm:size-80 sm:border-[60px]" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                <MessageCircle className="size-4" />
                                Mulai perjalananmu
                            </div>
                            <h2 className="max-w-3xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                                Impian menjadi dokter layak dipersiapkan dengan
                                cara terbaik.
                            </h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-background/65 sm:text-base">
                                Ceritakan target dan tantangan belajarmu. Tim
                                AveRose akan membantu memilih program yang
                                paling sesuai.
                            </p>
                        </div>
                        <a
                            href={consultationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-xl transition hover:-translate-y-0.5 sm:w-fit"
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
