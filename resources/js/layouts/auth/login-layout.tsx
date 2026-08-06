import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

export default function LoginLayout({ children }: PropsWithChildren) {
    const { name } = usePage().props;

    return (
        <main className="auth-light-theme min-h-svh bg-background text-foreground">
            <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,0.98fr)]">
                <section className="flex min-h-svh flex-col bg-background px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
                    <Link
                        href={home()}
                        className="flex w-fit items-center gap-3 text-lg font-medium"
                    >
                        <AppLogoIcon className="size-9 fill-current text-foreground" />
                        <span>{name}</span>
                    </Link>

                    <div className="flex flex-1 items-center justify-center py-6">
                        <div className="w-full max-w-[360px]">{children}</div>
                    </div>
                </section>

                <section className="sticky top-0 hidden h-svh overflow-hidden bg-white lg:block">
                    <img
                        src="/images/landing/future-alpha-doctor-hero.png"
                        alt="Siswa Indonesia percaya diri mempersiapkan diri menjadi calon dokter"
                        className="absolute inset-0 size-full object-cover object-[57%_center]"
                    />
                    <div className="absolute inset-y-0 left-0 w-[36%] bg-gradient-to-r from-background via-background/88 to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-[24%] bg-gradient-to-l from-background/72 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/56 to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.04)_48%,rgba(16,42,58,0.08)_100%)]" />
                </section>
            </div>
        </main>
    );
}
