import {
    ArrowRight,
    Award,
    Check,
    CirclePlay,
    GraduationCap,
    Sparkles,
    Star,
    Stethoscope,
    UsersRound,
} from 'lucide-react';
import { consultationUrl } from './links';

function HeroIllustration() {
    return (
        <div className="relative mx-auto aspect-[4/4.4] w-full max-w-[540px]">
            <div className="absolute top-[8%] right-[2%] size-28 rounded-full bg-amber-300/40 blur-3xl sm:size-36" />
            <div className="absolute bottom-[12%] left-[3%] size-36 rounded-full bg-primary/20 blur-3xl sm:size-48" />
            <div className="absolute inset-[10%_9%_8%_12%] rotate-3 overflow-hidden rounded-[2rem] bg-primary shadow-2xl shadow-primary/20 sm:rounded-[3rem]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(255,255,255,0.35),transparent_26%),linear-gradient(155deg,transparent_20%,rgba(0,0,0,0.16))]" />
                <div className="absolute -right-16 -bottom-12 size-72 rounded-full border-[44px] border-white/10" />
            </div>
            <div className="absolute inset-[18%_16%_12%_19%] -rotate-2 rounded-[1.75rem] border border-white/60 bg-background/95 p-5 shadow-xl backdrop-blur sm:rounded-[2.5rem] sm:p-9">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-primary" />
                        <span className="h-2 w-14 rounded-full bg-muted sm:w-20" />
                    </div>
                    <Stethoscope className="size-6 text-primary sm:size-7" />
                </div>
                <div className="mt-6 space-y-3 sm:mt-9 sm:space-y-4">
                    <div className="h-2.5 w-3/4 rounded-full bg-foreground/85 sm:h-3" />
                    <div className="h-2.5 w-1/2 rounded-full bg-foreground/20 sm:h-3" />
                    <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-3 sm:pt-3">
                        {[78, 91, 86].map((score) => (
                            <div
                                key={score}
                                className="rounded-xl bg-muted p-2 text-center sm:rounded-2xl sm:p-3"
                            >
                                <div className="font-heading text-base font-semibold text-primary sm:text-xl">
                                    {score}
                                </div>
                                <div className="mt-1 text-[8px] text-muted-foreground sm:text-[9px]">
                                    Progress
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute right-5 bottom-5 left-5 flex items-end gap-1.5 sm:right-8 sm:bottom-8 sm:left-8 sm:gap-2">
                    {[35, 58, 44, 72, 62, 86, 78].map((height, index) => (
                        <span
                            key={height}
                            className={`flex-1 rounded-t-md ${index === 5 ? 'bg-amber-400' : 'bg-primary/25'}`}
                            style={{ height: `${height * 0.45}px` }}
                        />
                    ))}
                </div>
            </div>
            <div className="absolute top-[4%] left-0 flex items-center gap-2 rounded-xl border bg-background/95 p-2.5 pr-3 shadow-lg backdrop-blur sm:gap-3 sm:rounded-2xl sm:p-3 sm:pr-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 sm:size-10 sm:rounded-xl dark:bg-amber-400/15 dark:text-amber-300">
                    <Award className="size-5" />
                </span>
                <span>
                    <span className="block text-[10px] text-muted-foreground sm:text-xs">
                        Target utama
                    </span>
                    <span className="block text-xs font-semibold sm:text-sm">
                        Fakultas Kedokteran
                    </span>
                </span>
            </div>
            <div className="absolute right-0 bottom-[7%] flex items-center gap-2 rounded-xl border bg-background/95 p-2.5 pr-3 shadow-lg backdrop-blur sm:gap-3 sm:rounded-2xl sm:p-3 sm:pr-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10 sm:rounded-xl">
                    <UsersRound className="size-5" />
                </span>
                <span>
                    <span className="block font-heading text-base font-semibold sm:text-lg">
                        300+
                    </span>
                    <span className="block text-[10px] text-muted-foreground sm:text-xs">
                        Siswa bergabung
                    </span>
                </span>
            </div>
            <Sparkles className="absolute top-[15%] right-[3%] size-6 text-amber-500 sm:size-7" />
            <GraduationCap className="absolute bottom-[1%] left-[14%] size-8 -rotate-12 text-primary sm:size-9" />
        </div>
    );
}

export default function HeroSection() {
    return (
        <section
            id="home"
            className="relative scroll-mt-16 border-b border-border/50 sm:scroll-mt-20"
        >
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--border),transparent_60%)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border),transparent_60%)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_90%)] bg-[size:64px_64px]" />
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-10 lg:py-24">
                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary sm:mb-6">
                        <Star className="size-3.5 fill-current" />
                        #FutureAlphaDoctors
                    </div>
                    <h1 className="max-w-3xl font-heading text-[2.65rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                        Langkah terarah menuju{' '}
                        <span className="relative text-primary">
                            Fakultas Kedokteran
                            <svg
                                className="absolute -bottom-2 left-0 h-2.5 w-full text-amber-400 sm:-bottom-3 sm:h-3"
                                viewBox="0 0 300 18"
                                fill="none"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M3 13C77 3 178 3 297 10"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>{' '}
                        impian.
                    </h1>
                    <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8">
                        Bimbel privat 1-on-1 untuk persiapan SNBP, SNBT, dan
                        ujian mandiri bersama mentor pilihan dan strategi yang
                        dibuat khusus untuk targetmu.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                        <a
                            href={consultationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
                        >
                            Konsultasi program gratis
                            <ArrowRight className="size-4" />
                        </a>
                        <a
                            href="#program"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border bg-background px-6 py-4 text-sm font-semibold transition hover:bg-muted"
                        >
                            <CirclePlay className="size-5 text-primary" />
                            Lihat program
                        </a>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground sm:mt-9 sm:gap-x-6">
                        {[
                            'Mentor terseleksi',
                            'Jadwal fleksibel',
                            'Progres terpantau',
                        ].map((item) => (
                            <span
                                key={item}
                                className="flex items-center gap-2"
                            >
                                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Check className="size-3.5" />
                                </span>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <HeroIllustration />
            </div>
        </section>
    );
}
