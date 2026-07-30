import { Head, usePage } from '@inertiajs/react';
import Footer from '@/components/landing/footer';
import Navbar from '@/components/landing/navbar';
import ProgramCard from '@/components/landing/program-card';
import type {LandingProgramCardData} from '@/components/landing/program-card';

export default function ProgramsIndex({
    programs,
}: {
    programs: LandingProgramCardData[];
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Program AveRose" />
            <div className="min-h-screen bg-[#f8fbfa] text-[#102a3a]">
                <Navbar isAuthenticated={Boolean(auth.user)} />
                <main>
                    <section className="py-14 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold tracking-[0.18em] text-[#0f8f7a] uppercase">
                                    Semua program
                                </p>
                                <h1 className="mt-4 font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
                                    Pilih program yang paling dekat dengan
                                    target belajarmu.
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-[#526b7b]">
                                    Baca detail program, lalu lanjutkan ke
                                    konsultasi untuk menentukan roadmap belajar
                                    personal.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 xl:grid-cols-4">
                                {programs.map((program) => (
                                    <ProgramCard
                                        key={program.id}
                                        program={program}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}
