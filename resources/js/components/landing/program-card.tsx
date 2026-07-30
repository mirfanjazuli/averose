import { ArrowRight, BookOpen, ChevronRight, GraduationCap, Star, UsersRound } from 'lucide-react';

export type LandingProgramCardData = {
    description: string | null;
    enrollmentsCount: number;
    id: number;
    slug: string;
    subjectsCount: number;
    thumbnailUrl: string | null;
    title: string;
};

function compactNumber(value: number): string {
    if (value >= 1000) {
        return `${new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 1,
        }).format(value / 1000)}k`;
    }

    return String(value);
}

export default function ProgramCard({
    program,
}: {
    program: LandingProgramCardData;
}) {
    return (
        <article className="group flex overflow-hidden rounded-[1.75rem] border border-[#dcece7] bg-white p-3 shadow-sm shadow-[#102a3a]/[0.03] transition duration-300 hover:-translate-y-1 hover:border-[#bfe4db] hover:shadow-xl hover:shadow-[#102a3a]/8">
            <div className="flex min-h-full w-full flex-col">
                <div className="relative flex aspect-[1.28] items-center justify-center overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_18%_18%,rgba(217,164,65,0.72),transparent_28%),linear-gradient(135deg,#0b7668_0%,#31b89d_52%,#f8fbfa_100%)]">
                    {program.thumbnailUrl ? (
                        <img
                            src={program.thumbnailUrl}
                            alt=""
                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="relative flex size-20 items-center justify-center rounded-[1.5rem] bg-white/20 text-white ring-1 ring-white/28 backdrop-blur-sm">
                            <GraduationCap
                                className="size-10"
                                strokeWidth={1.45}
                            />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0)_46%),linear-gradient(to_top,rgba(16,42,58,0.18),transparent_48%)]" />
                </div>

                <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                    <h3 className="min-h-14 overflow-hidden font-heading text-xl font-semibold leading-tight text-ellipsis text-[#102a3a] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {program.title}
                    </h3>
                    <p className="mt-2 min-h-12 overflow-hidden text-sm leading-6 text-ellipsis text-[#526b7b] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {program.description ||
                            'Program belajar AveRose dengan pendampingan personal dan target yang terukur.'}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-[#526b7b]">
                        <div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#102a3a]">
                                <Star className="size-3.5 fill-[#d9a441] text-[#d9a441]" />
                                <span>4.9</span>
                            </div>
                            <p className="mt-1 text-[10px] leading-none text-[#8ca1ad]">
                                120 rating
                            </p>
                        </div>
                        <div className="border-x border-[#edf3f1] px-2">
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#102a3a]">
                                <BookOpen className="size-3.5 text-[#0f8f7a]" />
                                <span>{program.subjectsCount}</span>
                            </div>
                            <p className="mt-1 text-[10px] leading-none text-[#8ca1ad]">
                                subjects
                            </p>
                        </div>
                        <div className="pl-1">
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#102a3a]">
                                <UsersRound className="size-3.5 text-[#0f8f7a]" />
                                <span>
                                    {compactNumber(program.enrollmentsCount)}
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] leading-none text-[#8ca1ad]">
                                students
                            </p>
                        </div>
                    </div>

                    <a
                        href={`/programs/${program.slug}`}
                        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d9a441] text-sm font-semibold text-[#102a3a] transition duration-300"
                    >
                        Lihat Detail
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </div>
        </article>
    );
}
