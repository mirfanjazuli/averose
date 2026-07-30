import { Head, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    GraduationCap,
    Star,
    UsersRound,
} from 'lucide-react';
import Footer from '@/components/landing/footer';
import { consultationUrl } from '@/components/landing/links';
import Navbar from '@/components/landing/navbar';

type ProgramDetail = {
    description: string | null;
    enrollmentsCount: number;
    eyebrow: string;
    id: number;
    slug: string;
    subjects: {
        icon: string | null;
        id: number;
        name: string;
    }[];
    subjectsCount: number;
    thumbnailUrl: string | null;
    title: string;
    variants: {
        id: number;
        name: string;
        session: number;
    }[];
};

function compactNumber(value: number): string {
    if (value >= 1000) {
        return `${new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 1,
        }).format(value / 1000)}k`;
    }

    return String(value);
}

export default function ProgramDetailPage({
    program,
}: {
    program: ProgramDetail;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title={`${program.title} | AveRose`} />
            <div className="min-h-screen bg-[#f8fbfa] text-[#102a3a]">
                <Navbar isAuthenticated={Boolean(auth.user)} />
                <main>
                    <section className="bg-white">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.82fr] lg:px-10 lg:py-20">
                            <div>
                                <a
                                    href="/#program"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f8f7a]"
                                >
                                    <ArrowLeft className="size-4" />
                                    Program
                                </a>
                                <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-[#0f8f7a] uppercase">
                                    {program.eyebrow}
                                </p>
                                <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
                                    {program.title}
                                </h1>
                                <p className="mt-6 max-w-2xl text-base leading-8 text-[#526b7b] sm:text-lg">
                                    {program.description ||
                                        'Program belajar AveRose dengan pendampingan personal dan target yang terukur.'}
                                </p>

                                <div className="mt-8 grid max-w-xl grid-cols-3 gap-4">
                                    <div>
                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                            <Star className="size-4 fill-[#d9a441] text-[#d9a441]" />
                                            4.9
                                        </div>
                                        <p className="mt-1 text-xs text-[#8ca1ad]">
                                            120 rating
                                        </p>
                                    </div>
                                    <div className="border-x border-[#edf3f1] px-4">
                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                            <BookOpen className="size-4 text-[#0f8f7a]" />
                                            {program.subjectsCount}
                                        </div>
                                        <p className="mt-1 text-xs text-[#8ca1ad]">
                                            subjects
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                            <UsersRound className="size-4 text-[#0f8f7a]" />
                                            {compactNumber(
                                                program.enrollmentsCount,
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-[#8ca1ad]">
                                            students
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                                    <a
                                        href={consultationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d9a441] px-6 py-4 text-sm font-semibold text-[#102a3a] shadow-lg shadow-[#d9a441]/20 transition hover:-translate-y-0.5"
                                    >
                                        Konsultasi Program
                                        <ArrowRight className="size-4" />
                                    </a>
                                </div>
                            </div>

                            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[2.25rem] bg-[radial-gradient(circle_at_18%_18%,rgba(217,164,65,0.72),transparent_28%),linear-gradient(135deg,#0b7668_0%,#31b89d_52%,#f8fbfa_100%)]">
                                {program.thumbnailUrl ? (
                                    <img
                                        src={program.thumbnailUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <GraduationCap
                                        className="size-28 text-white"
                                        strokeWidth={1.25}
                                    />
                                )}
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0)_46%),linear-gradient(to_top,rgba(16,42,58,0.16),transparent_50%)]" />
                            </div>
                        </div>
                    </section>

                    <section className="py-14 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
                            <div className="rounded-[2rem] bg-white p-6 ring-1 ring-[#dcece7] sm:p-8">
                                <h2 className="font-heading text-2xl font-semibold">
                                    Mata pelajaran
                                </h2>
                                <div className="mt-6 grid gap-3">
                                    {program.subjects.length > 0 ? (
                                        program.subjects.map((subject) => (
                                            <div
                                                key={subject.id}
                                                className="flex items-center gap-3 rounded-2xl bg-[#f8fbfa] px-4 py-3"
                                            >
                                                <CheckCircle2 className="size-5 text-[#0f8f7a]" />
                                                <span className="text-sm font-semibold">
                                                    {subject.name}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm leading-6 text-[#526b7b]">
                                            Detail mata pelajaran akan
                                            disesuaikan saat konsultasi.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] bg-white p-6 ring-1 ring-[#dcece7] sm:p-8">
                                <h2 className="font-heading text-2xl font-semibold">
                                    Pilihan sesi
                                </h2>
                                <div className="mt-6 grid gap-3">
                                    {program.variants.length > 0 ? (
                                        program.variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8fbfa] px-4 py-3"
                                            >
                                                <span className="text-sm font-semibold">
                                                    {variant.name}
                                                </span>
                                                <span className="text-sm text-[#526b7b]">
                                                    {variant.session} sesi
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm leading-6 text-[#526b7b]">
                                            Jumlah sesi akan direkomendasikan
                                            sesuai kebutuhan belajar siswa.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
