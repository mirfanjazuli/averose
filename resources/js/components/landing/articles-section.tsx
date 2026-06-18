import { ArrowRight } from 'lucide-react';
import { articles } from './data';
import { instagramUrl } from './links';
import SectionHeading from './section-heading';

export default function ArticlesSection() {
    return (
        <section
            id="artikel"
            className="scroll-mt-16 bg-muted/45 py-16 sm:scroll-mt-20 sm:py-24 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <SectionHeading
                        eyebrow="Insight AveRose"
                        title="Bekal belajar untuk calon dokter masa depan"
                    />
                    <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary"
                    >
                        Lihat konten di Instagram
                        <ArrowRight className="size-4" />
                    </a>
                </div>
                <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
                    {articles.map((article, index) => {
                        const Icon = article.icon;

                        return (
                            <article
                                key={article.title}
                                className="group overflow-hidden rounded-[1.75rem] border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-[2rem]"
                            >
                                <div
                                    className={`flex aspect-[16/10] items-center justify-center ${
                                        index === 0
                                            ? 'bg-[#dcefe7] text-[#176b52] dark:bg-primary/15 dark:text-primary'
                                            : index === 1
                                              ? 'bg-[#e2edf5] text-[#285e78] dark:bg-sky-400/15 dark:text-sky-300'
                                              : 'bg-[#fef0cd] text-[#9a6800] dark:bg-amber-400/15 dark:text-amber-300'
                                    }`}
                                >
                                    <Icon
                                        className="size-16 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:size-20"
                                        strokeWidth={1.2}
                                    />
                                </div>
                                <div className="p-5 sm:p-6">
                                    <p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                                        {article.category}
                                    </p>
                                    <h3 className="mt-3 font-heading text-xl leading-snug font-semibold">
                                        {article.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {article.description}
                                    </p>
                                    <a
                                        href={instagramUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                                    >
                                        Baca selengkapnya
                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
