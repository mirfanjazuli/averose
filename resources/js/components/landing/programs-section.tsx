import { BookOpenCheck, ChevronRight } from 'lucide-react';
import { consultationUrl } from './links';
import SectionHeading from './section-heading';

type LandingProgram = {
    description: string | null;
    eyebrow: string;
    id: number;
    slug: string;
    thumbnailUrl: string | null;
    title: string;
};

export default function ProgramsSection({
    programs,
}: {
    programs: LandingProgram[];
}) {
    if (programs.length === 0) {
        return null;
    }

    return (
        <section
            id="program"
            className="scroll-mt-16 bg-[#f8fbfa] py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <SectionHeading
                        eyebrow="Layanan kami"
                        title="Program belajar untuk setiap tahap perjuanganmu"
                    />
                    <p className="max-w-md text-sm leading-6 text-[#526b7b] lg:text-right">
                        Mulai dari membangun fondasi sampai menghadapi seleksi
                        kampus, AveRose mendampingi dengan program yang fokus.
                    </p>
                </div>
                <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
                    {programs.map((program, index) => {
                        return (
                            <article
                                key={program.id}
                                className="group relative overflow-hidden rounded-[1.75rem] border border-[#dcece7] bg-white p-5 shadow-sm shadow-[#102a3a]/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#102a3a]/8 sm:rounded-[2rem] sm:p-6"
                            >
                                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#e4f5f0] text-[#0f8f7a] sm:rounded-[1.5rem]">
                                    {program.thumbnailUrl ? (
                                        <img
                                            src={program.thumbnailUrl}
                                            alt=""
                                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex size-28 items-center justify-center rounded-full border border-current/15 bg-white/70 sm:size-32">
                                            <BookOpenCheck
                                                className="size-14 sm:size-16"
                                                strokeWidth={1.35}
                                            />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />
                                    <span className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#102a3a] shadow-lg sm:size-11 sm:rounded-2xl">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="px-1 pt-6">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-[#0f8f7a] uppercase">
                                        {program.eyebrow}
                                    </p>
                                    <h3 className="mt-2 font-heading text-2xl font-semibold text-[#102a3a]">
                                        {program.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-[#526b7b]">
                                        {program.description ||
                                            'Program belajar AveRose dengan pendampingan personal dan target yang terukur.'}
                                    </p>
                                    <a
                                        href={consultationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0f8f7a]"
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
