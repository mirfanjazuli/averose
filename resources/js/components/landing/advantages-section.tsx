import { Check, Trophy } from 'lucide-react';
import { advantages } from './data';
import SectionHeading from './section-heading';

export default function AdvantagesSection() {
    return (
        <section
            id="keunggulan"
            className="scroll-mt-16 bg-white py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <SectionHeading
                    eyebrow="Cara belajar AveRose"
                    title="Lebih personal, fleksibel, dan tepat sasaran"
                    description="Siswa memahami apa yang harus dikerjakan, kenapa itu penting, dan sejauh mana progresnya."
                    centered
                />
                <div className="mt-12 space-y-16 sm:mt-16 sm:space-y-24">
                    {advantages.map((advantage, index) => {
                        const Icon = advantage.icon;
                        const visualTone =
                            advantage.color === 'amber'
                                ? 'bg-[#fff3d5] text-[#9b6a13]'
                                : advantage.color === 'blue'
                                  ? 'bg-[#eef5f8] text-[#102a3a]'
                                  : 'bg-[#e4f5f0] text-[#0f8f7a]';

                        return (
                            <article
                                key={advantage.title}
                                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20"
                            >
                                <div
                                    className={
                                        index % 2 === 1 ? 'lg:order-2' : ''
                                    }
                                >
                                    <div
                                        className={`relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-[2rem] border border-[#dcece7] shadow-xl shadow-[#102a3a]/8 sm:rounded-[2.5rem] ${visualTone}`}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:36px_36px]" />
                                        <div className="absolute top-[13%] left-[10%] flex size-20 items-center justify-center rounded-2xl bg-white/95 text-[#0f8f7a] shadow-xl sm:top-[15%] sm:left-[13%] sm:size-28 sm:rounded-[2rem]">
                                            <Icon
                                                className="size-10 sm:size-14"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                        <div className="absolute right-[7%] bottom-[10%] left-[18%] rounded-2xl bg-white/95 p-4 text-[#102a3a] shadow-2xl sm:right-[10%] sm:bottom-[13%] sm:left-[22%] sm:rounded-[2rem] sm:p-6">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-[10px] text-[#647987] sm:text-xs">
                                                        Progres belajar
                                                    </div>
                                                    <div className="mt-1 font-heading text-lg font-semibold sm:text-2xl">
                                                        Konsisten
                                                    </div>
                                                </div>
                                                <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff3d5] text-[#9b6a13] sm:size-12 sm:rounded-2xl">
                                                    <Trophy className="size-5 sm:size-6" />
                                                </span>
                                            </div>
                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8f3ef] sm:mt-5 sm:h-2.5">
                                                <div className="h-full w-[82%] rounded-full bg-[#0f8f7a]" />
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
                                                {[6, 12, 24].map((value) => (
                                                    <div
                                                        key={value}
                                                        className="rounded-lg bg-[#f4faf8] p-1.5 text-center sm:rounded-xl sm:p-2"
                                                    >
                                                        <div className="text-xs font-bold sm:text-sm">
                                                            {value}
                                                        </div>
                                                        <div className="text-[8px] text-[#647987] sm:text-[9px]">
                                                            sesi
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={
                                        index % 2 === 1 ? 'lg:order-1' : ''
                                    }
                                >
                                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0f8f7a] uppercase">
                                        {advantage.eyebrow}
                                    </p>
                                    <h3 className="mt-3 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight text-[#102a3a] sm:text-4xl">
                                        {advantage.title}
                                    </h3>
                                    <p className="mt-5 max-w-xl leading-7 text-[#526b7b]">
                                        {advantage.description}
                                    </p>
                                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                        {advantage.points.map((point) => (
                                            <div
                                                key={point}
                                                className="flex items-center gap-3 text-sm font-medium"
                                            >
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e4f5f0] text-[#0f8f7a]">
                                                    <Check className="size-3.5" />
                                                </span>
                                                {point}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
