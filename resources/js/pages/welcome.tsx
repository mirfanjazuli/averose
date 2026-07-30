import { Head, usePage } from '@inertiajs/react';
import AdvantagesSection from '@/components/landing/advantages-section';
import ArticlesSection from '@/components/landing/articles-section';
import CtaSection from '@/components/landing/cta-section';
import FaqSection from '@/components/landing/faq-section';
import Footer from '@/components/landing/footer';
import HeroSection from '@/components/landing/hero-section';
import Navbar from '@/components/landing/navbar';
import ProgramsSection from '@/components/landing/programs-section';
import SectionConnector from '@/components/landing/section-connector';
import SuccessStoriesSection from '@/components/landing/success-stories-section';

type LandingProgram = {
    description: string | null;
    enrollmentsCount: number;
    eyebrow: string;
    id: number;
    slug: string;
    subjectsCount: number;
    thumbnailUrl: string | null;
    title: string;
};

export default function Welcome({ programs }: { programs: LandingProgram[] }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bimbel Privat Spesialis Masuk FK">
                <meta
                    name="description"
                    content="AveRose adalah bimbel privat spesialis masuk Fakultas Kedokteran dengan pendampingan personal, mentor berkualitas, dan strategi belajar terukur."
                />
            </Head>

            <div className="min-h-screen overflow-x-clip bg-[#f8fbfa] text-[#102a3a]">
                <Navbar isAuthenticated={Boolean(auth.user)} />
                <main>
                    <HeroSection />
                    {programs.length > 0 && (
                        <ProgramsSection programs={programs} />
                    )}
                    <AdvantagesSection />
                    <SectionConnector tone="whiteToSoft" />
                    <SuccessStoriesSection />
                    <SectionConnector tone="soft" />
                    <ArticlesSection />
                    <SectionConnector tone="soft" />
                    <FaqSection />
                    <CtaSection />
                </main>
                <Footer />
            </div>
        </>
    );
}
