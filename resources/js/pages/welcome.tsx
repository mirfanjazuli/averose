import { Head, usePage } from '@inertiajs/react';
import AdvantagesSection from '@/components/landing/advantages-section';
import ArticlesSection from '@/components/landing/articles-section';
import CtaSection from '@/components/landing/cta-section';
import Footer from '@/components/landing/footer';
import HeroSection from '@/components/landing/hero-section';
import Navbar from '@/components/landing/navbar';
import ProgramsSection from '@/components/landing/programs-section';
import SuccessStoriesSection from '@/components/landing/success-stories-section';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bimbel Privat Spesialis Masuk FK">
                <meta
                    name="description"
                    content="AveRose adalah bimbel privat spesialis masuk Fakultas Kedokteran dengan pendampingan personal, mentor berkualitas, dan strategi belajar terukur."
                />
            </Head>

            <div className="min-h-screen overflow-x-clip bg-background text-foreground">
                <Navbar isAuthenticated={Boolean(auth.user)} />
                <main>
                    <HeroSection />
                    <ProgramsSection />
                    <AdvantagesSection />
                    <SuccessStoriesSection />
                    <ArticlesSection />
                    <CtaSection />
                </main>
                <Footer />
            </div>
        </>
    );
}
