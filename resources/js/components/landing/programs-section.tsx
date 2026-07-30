import { ArrowRight, GraduationCap } from 'lucide-react';
import ProgramCard from './program-card';
import type {LandingProgramCardData} from './program-card';

type LandingProgram = LandingProgramCardData & {
    eyebrow: string;
};

export default function ProgramsSection({
    programs,
}: {
    programs: LandingProgram[];
}) {
    if (programs.length === 0) {
        return null;
    }

    const featuredPrograms = programs.slice(0, 3);

    return (
        <section
            id="program"
            className="scroll-mt-16 bg-white py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">

                    <h2 className="max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance text-[#102a3a] sm:text-5xl lg:text-[3.5rem]">
                        Satu target, <br/> program belajar yang tepat.
                    </h2>

                <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 xl:grid-cols-4">
                    {featuredPrograms.map((program) => (
                        <ProgramCard key={program.id} program={program} />
                    ))}

                    <a
                        href="/programs"
                        className="group flex min-h-full overflow-hidden rounded-[1.75rem] border border-[#dcece7] text-white shadow-sm shadow-[#102a3a]/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#102a3a]/12"
                    >
                        <div className="flex min-h-full w-full flex-col rounded-[1.35rem] bg-[radial-gradient(circle_at_18%_18%,rgba(217,164,65,0.5),transparent_28%),linear-gradient(135deg,#102a3a_0%,#0b7668_72%,#31b89d_100%)] p-6">
                            <div className="mt-auto pt-24">
                                <h3 className="mt-3 font-heading text-3xl font-semibold leading-tight">
                                    Jelajahi <br/> semua program.
                                </h3>
                                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                                    Lihat Semua Program
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    );
}
