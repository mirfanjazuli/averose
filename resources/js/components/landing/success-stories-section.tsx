import { Award, Star } from 'lucide-react';
import { testimonials } from './data';

export default function SuccessStoriesSection() {
    return (
        <section
            id="kisah-sukses"
            className="scroll-mt-16 py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="overflow-hidden rounded-[2rem] bg-primary px-5 py-10 text-primary-foreground sm:rounded-[2.5rem] sm:px-10 sm:py-12 lg:px-14">
                    <div className="grid items-end gap-7 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase opacity-80">
                                <Award className="size-4" />
                                Kisah sukses
                            </div>
                            <h2 className="max-w-2xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                                Mereka pernah berada di titik yang sama:
                                berjuang masuk FK impian.
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-heading text-4xl font-semibold sm:text-5xl">
                                300+
                            </span>
                            <span className="max-w-28 text-sm leading-5 opacity-75">
                                siswa telah belajar bersama AveRose
                            </span>
                        </div>
                    </div>
                    <div className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <article
                                key={testimonial.name}
                                className="rounded-[1.5rem] bg-background p-5 text-foreground sm:rounded-[1.75rem] sm:p-6"
                            >
                                <div className="flex gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className="size-4 fill-current"
                                        />
                                    ))}
                                </div>
                                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                                    “{testimonial.quote}”
                                </p>
                                <div className="mt-6 flex items-center gap-3 border-t pt-5">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                        {testimonial.initials}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">
                                            {testimonial.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {testimonial.school}
                                        </span>
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
