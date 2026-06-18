import { ChevronRight } from 'lucide-react';
import { programs } from './data';
import { consultationUrl } from './links';
import SectionHeading from './section-heading';

export default function ProgramsSection() {
    return (
        <section
            id="program"
            className="scroll-mt-16 py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <SectionHeading
                        eyebrow="Layanan kami"
                        title="Program belajar untuk setiap tahap perjuanganmu"
                    />
                    <p className="max-w-md text-sm leading-6 text-muted-foreground lg:text-right">
                        Mulai dari membangun fondasi sampai menghadapi seleksi
                        kampus, AveRose mendampingi dengan program yang fokus.
                    </p>
                </div>
                <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
                    {programs.map((program, index) => {
                        const Icon = program.icon;

                        return (
                            <article
                                key={program.title}
                                className="group relative overflow-hidden rounded-[1.75rem] border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem] sm:p-6"
                            >
                                <div
                                    className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.35rem] sm:rounded-[1.5rem] ${program.tone}`}
                                >
                                    <div className="relative flex size-28 items-center justify-center rounded-full border border-current/15 bg-background/10 sm:size-32">
                                        <Icon
                                            className="size-14 sm:size-16"
                                            strokeWidth={1.35}
                                        />
                                        <span className="absolute -top-2 -right-3 flex size-10 items-center justify-center rounded-xl bg-background text-sm font-bold text-foreground shadow-lg sm:size-11 sm:rounded-2xl">
                                            0{index + 1}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-1 pt-6">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                        {program.eyebrow}
                                    </p>
                                    <h3 className="mt-2 font-heading text-2xl font-semibold">
                                        {program.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {program.description}
                                    </p>
                                    <a
                                        href={consultationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                                    >
                                        Pelajari program
                                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
