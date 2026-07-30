import { ChevronRight, Star } from 'lucide-react';
import { testimonials } from './data';

function Stars() {
    return (
        <div className="flex gap-1 text-[#d9a441]">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="size-4 fill-current" />
            ))}
        </div>
    );
}

export default function SuccessStoriesSection() {
    return (
        <section
            id="kisah-sukses"
            className="scroll-mt-16 py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="mb-10 flex flex-col gap-4">
                    <h2 className="mt-4 max-w-2xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance text-[#102a3a] sm:text-5xl">
                        Dari Target <br /> Menjadi Pencapaian.
                    </h2>
                </div>

                <div className="relative">
                    <div className="grid gap-5 lg:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <article
                                key={testimonial.name}
                                className="flex min-h-[430px] flex-col rounded-[1.75rem] bg-white p-5 text-[#102a3a] shadow-sm shadow-[#102a3a]/[0.03] ring-1 ring-[#dcece7]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e4f5f0] text-sm font-bold text-[#0f8f7a]">
                                            {testimonial.initials}
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                {testimonial.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-[#647987]">
                                                {testimonial.school}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[#dcece7]">“”</span>
                                </div>

                                <div className="mt-8">
                                    <p className="text-lg font-semibold leading-7">
                                        “{testimonial.result}”
                                    </p>
                                    <p className="mt-4 text-sm leading-6 text-[#526b7b]">
                                        {testimonial.quote}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                                    <Stars />
                                    <span className="text-xs text-[#647987]">
                                        09/30/2024
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        aria-label="Next story"
                        className="absolute top-1/2 right-4 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#102a3a]/12 text-white backdrop-blur-sm transition hover:bg-[#102a3a]/24 lg:flex"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
