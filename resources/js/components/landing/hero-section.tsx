import { ArrowRight } from 'lucide-react';
import HeroImage from './hero-image';
import { consultationUrl } from './links';

function HeroVisual() {
    return (
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[590px]">
            <div className="absolute inset-0 overflow-hidden rounded-r-[2rem] sm:rounded-r-[3rem]">
                <HeroImage
                    fetchPriority="high"
                    className="size-full [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.08)_8%,rgba(0,0,0,0.52)_24%,black_43%),linear-gradient(to_bottom,transparent_0%,black_12%,black_86%,transparent_100%)] [mask-composite:intersect] object-cover object-[57%_center] [-webkit-mask-composite:source-in] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.08)_8%,rgba(0,0,0,0.52)_24%,black_43%),linear-gradient(to_bottom,transparent_0%,black_12%,black_86%,transparent_100%)]"
                />
                <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white via-white/88 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-[18%] rounded-r-[2rem] bg-gradient-to-l from-white/75 to-transparent sm:rounded-r-[3rem]" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/56 to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.36)_0%,rgba(255,255,255,0.06)_48%,rgba(16,42,58,0.05)_100%)]" />
            </div>
        </div>
    );
}

export default function HeroSection() {
    return (
        <section
            id="home"
            className="relative scroll-mt-16 bg-white sm:scroll-mt-20"
        >
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,143,122,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,143,122,0.08)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] bg-[size:64px_64px]" />
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-4 sm:px-8 sm:pb-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-10 lg:pb-8">
                <div className="flex min-h-[calc(100vh-4rem)] items-center sm:min-h-[calc(100vh-5rem)] lg:-translate-y-8">
                    <div className="max-w-3xl">
                        <h1 className="font-heading text-[2.65rem] leading-[1.04] font-semibold tracking-tight text-balance text-[#102a3a] sm:text-6xl lg:text-7xl">
                            Persiapkan Langkahmu Menjadi{' '}
                            <span className="text-[#0f8f7a]">
                                Future Alpha Doctor
                            </span>
                        </h1>
                        <p className="mt-7 max-w-2xl text-base leading-7 text-[#526b7b] sm:mt-8 sm:text-lg sm:leading-8">
                            Bimbingan privat 1-on-1 untuk persiapan FK,
                            olimpiade sains, dan perkuliahan kedokteran bersama
                            mentor berpengalaman.
                        </p>
                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d9a441] px-6 py-4 text-sm font-semibold text-[#102a3a] shadow-lg shadow-[#d9a441]/20 transition hover:-translate-y-0.5"
                            >
                                Konsultasi Program Sekarang
                                <ArrowRight className="size-4" />
                            </a>
                            <a
                                href={consultationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-2xl border border-[#dcece7] bg-white px-6 py-4 text-sm font-semibold text-[#102a3a] transition hover:bg-[#edf7f4]"
                            >
                                Coba Experience Class
                            </a>
                        </div>
                    </div>
                </div>
                <HeroVisual />
            </div>
        </section>
    );
}
